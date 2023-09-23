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

class ImageChooser(BaseNode):
    REQUIRED = {"images" : ("IMAGE", {})}
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    CATEGORY = "utilities/control"
    message = None

    def func(self, images):
        while(self.message is None):
            time.sleep(1)
        i = (int(self.message)-1) % images.shape[0]
        ImageChooser.message = None
        image = images[i].unsqueeze(0)
        return (image,)
    
    def IS_CHANGED(self, **kwargs):
        return float('nan')

routes = PromptServer.instance.routes

@routes.post('/image_selection')
async def make_image_selection(request):
    post = await request.post()
    ImageChooser.message = post.get("selection")
    return web.json_response({})