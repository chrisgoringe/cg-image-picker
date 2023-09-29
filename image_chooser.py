from server import PromptServer
import time
from aiohttp import web
from nodes import PreviewImage

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
    @classmethod
    def addMessage(cls, id, message):
        cls.messages[str(id)] = message
    @classmethod
    def haveMessage(cls, id):
        return str(id) in cls.messages
    @classmethod
    def popMessage(cls, id):
        return cls.messages.pop(str(id),None)


class ImageChooser():
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "images" : ("IMAGE", {}), 
            "id" : ("INT", {"default":42, "min":0, "max": 100000000}),
            }}

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    CATEGORY = "utilities/control"
    FUNCTION = "func"

    def func(self, images, id):
        while not MessageHolder.haveMessage(id):
            time.sleep(1)
        i = (int(MessageHolder.popMessage(id))-1) % images.shape[0]
        image = images[i].unsqueeze(0)
        return (image,)
    
    def IS_CHANGED(self, **kwargs):
        return float('nan')
    
class LatentChooser():
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "latents" : ("LATENT", {}), 
            "id" : ("INT", {"default":42, "min":0, "max": 100000000}),
        }}
    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("latent",)
    CATEGORY = "utilities/control"
    FUNCTION = "func"

    def func(self, latents, id):
        while not MessageHolder.haveMessage(id):
            time.sleep(1)

        i = (int(MessageHolder.popMessage(id))-1) % latents['samples'].shape[0]
        latent = {}
        for key in latents:
            latent[key] = latents[key][i].unsqueeze(0)
        return (latent,)
    
    def IS_CHANGED(self, **kwargs):
        return float('nan')

routes = PromptServer.instance.routes

@routes.post('/image_selection')
async def make_image_selection(request):
    post = await request.post()
    MessageHolder.addMessage(post.get("id"), post.get("selection"))
    return web.json_response({})