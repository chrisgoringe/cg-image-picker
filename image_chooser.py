from custom_nodes.cg_custom_core.base import BaseNode
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
    
class Chooser:
    message = None

class ImageChooser(BaseNode):
    REQUIRED = {"images" : ("IMAGE", {})}
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    CATEGORY = "utilities/control"

    def func(self, images):
        while(Chooser.message is None):
            time.sleep(1)
        i = (int(Chooser.message)-1) % images.shape[0]
        Chooser.message = None
        image = images[i].unsqueeze(0)
        return (image,)
    
    def IS_CHANGED(self, **kwargs):
        return float('nan')
    
class LatentChooser(BaseNode):
    REQUIRED = {"latents" : ("LATENT", {})}
    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("latent",)
    CATEGORY = "utilities/control"

    def func(self, latents):
        while(Chooser.message is None):
            time.sleep(1)
        i = (int(Chooser.message)-1) % latents['samples'].shape[0]
        Chooser.message = None
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
    Chooser.message = post.get("selection")
    return web.json_response({})