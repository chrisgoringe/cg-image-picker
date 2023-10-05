from server import PromptServer
import time, json
import torch
from aiohttp import web
from nodes import PreviewImage
from custom_nodes.cg_custom_core.ui_decorator import ui_signal

class Cancelled(Exception):
    pass

class PreviewImageChooser(PreviewImage):
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "func"
    CATEGORY = "utilities/control"

    def __init__(self):
        super().__init__()

    def func(self, **kwargs):
        ret = self.save_images(**kwargs)
        ret['result'] = (kwargs['images'],)
        return ret  
    
class MessageHolder:
    messages = {}
    lastCancel = time.monotonic()

    @classmethod
    def _addCancel(cls):
        cls.lastCancel = time.monotonic()

    @classmethod
    def _recentCancel(cls, period=1.0):
        return ((time.monotonic()-cls.lastCancel)<period)
    
    @classmethod
    def addMessage(cls, id, message):
        if message=='__cancel__':
            cls._addCancel()
        else:
            cls.messages[str(id)] = message
    
    @classmethod
    def waitForMessage(cls, id, period = 0.1):
        sid = str(id)
        while not (sid in cls.messages):
            if cls._recentCancel():
                raise Cancelled()
            time.sleep(period)
        if cls._recentCancel():
            raise Cancelled()
        return cls.messages.pop(str(id),None)

class BaseChooser():
    CATEGORY = "utilities/control"
    FUNCTION = "func"
    def IS_CHANGED(self, **kwargs):
        return float('nan')
    
class ImageChooser(BaseChooser):
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": { 
                "images" : ("IMAGE", {}),  
                "id" : ("LABEL", {"value":"__random__"}), 
                "mode" : (["Always pause", "Only pause if batch"],{}),
                }, 
            "optional": { "trigger": ("*",{}) }
        }
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)

    def func(self, images, id, mode, **kwargs):
        try:
            if (mode=="Always pause" or images.shape[0]>1):
                i = (int(MessageHolder.waitForMessage(id))-1) % images.shape[0]
            else:
                i = 0
            image = images[i].unsqueeze(0)
            return (image,)
        except Cancelled:
            return (None,)
    
class LatentChooser(BaseChooser):
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": { 
                "latents" : ("LATENT", {}),  
                "id" : ("LABEL", {"value":"__random__"}), 
                "mode" : (["Always pause", "Only pause if batch"],{}),
            },
            "optional": { "trigger": ("*",{}) }
        }
    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("latent",)

    def func(self, latents, id, mode, **kwargs):
        try:
            if (mode=="Always pause" or latents['samples'].shape[0]>1):
                i = (int(MessageHolder.waitForMessage(id))-1) % latents['samples'].shape[0]
            else:
                i=0
            latent = {}
            for key in latents:
                latent[key] = latents[key][i].unsqueeze(0)
            return (latent,)
        except Cancelled:
            return (None,)

def ints_from_comma_string(string):
    for entry in string.split(","):
        try:
            yield(int(entry.strip()))
        except ValueError:
            pass

@ui_signal('display_text')
class MultiLatentChooser(BaseChooser):
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "latents" : ("LATENT", {}), 
                "id" : ("LABEL", {"value":"__random__"}), 
                "positive" : ("STRING", {"default":""}),
                "negative" : ("STRING", {"default":""}),
                "mode" : (["Discard Previous", "Accumulate"],),
            }, 
            "optional": { "trigger": ("*",{}) }
        }
    
    RETURN_TYPES = ("LATENT","LATENT",)
    RETURN_NAMES = ("positives","negatives",)
    CATEGORY = "utilities/control/_testing"

    def __init__(self):
        self.positive:torch.Tensor = None
        self.negative:torch.Tensor = None

    @classmethod
    def batch(cls, latent1:torch.Tensor, latent2:torch.Tensor):
        if latent1 is not None and len(latent1.shape)==3:
            latent1.unsqueeze_(0)
        if len(latent2.shape)==3:
            latent2.unsqueeze_(0)

        if latent1 is None:
            return latent2.clone()
        
        if latent1.shape[1:] != latent2.shape[1:]:
            raise Exception("Latent shapes do not match")

        return torch.cat((latent1.clone(), latent2.clone()), dim=0)

    def func(self, latents, id, **kwargs):
        MessageHolder.waitForMessage(id)

        batch_size = int(latents['samples'].shape[0])
        latent_shape = latents['samples'].shape[1:]
        
        try:
            msg = MessageHolder.popMessage(id)
            message = json.loads(msg)
            if not isinstance(message,dict):
                raise Exception(message)
        except Cancelled:
            return (None, None, "Cancelled")
        
        if message['mode']=="Discard Previous":
            self.positive = None
            self.negative = None

        for new_positive in ints_from_comma_string(message['positive']):
            new_positive = (new_positive-1) % batch_size
            self.positive = self.batch(self.positive, latents["samples"][new_positive])
        n_p = int(self.positive.shape[0]) if self.positive is not None else 0
        positive = self.positive if self.positive is not None else torch.zeros(latent_shape).unsqueeze_(0)

        for new_negative in ints_from_comma_string(message['negative']):
            new_negative = (new_negative-1) % batch_size
            self.negative = self.batch(self.negative, latents["samples"][new_negative])
        n_n = int(self.negative.shape[0]) if self.negative is not None else 0
        negative = self.negative if self.negative is not None else torch.zeros(latent_shape).unsqueeze_(0)

        return ({'samples':positive}, {'samples':negative}, f"{n_p} in +ve, {n_n} in -ve" )

routes = PromptServer.instance.routes

@routes.post('/image_chooser_message')
async def make_image_selection(request):
    post = await request.post()
    MessageHolder.addMessage(post.get("id"), post.get("message"))
    return web.json_response({})
