from server import PromptServer
from .image_chooser_server import MessageHolder, Cancelled
import torch
from PIL import Image, ImageOps
import numpy as np
import folder_paths
import os, shutil

def copy_images_to_temp(directory):
    # return list of tuples (name, url)
    td = folder_paths.temp_directory
    files = []
    for filename in [f for f in os.listdir(directory) if f.endwith(".png") or f.endswith(".jpg")]:
        shutil.copyfile(os.path.join(directory, filename), os.path.join(td, filename))
        files.append( (filename, os.path.join("temp", filename)) )
    return files
    
def load_image(url):
    i = Image.open(url)
    i = ImageOps.exif_transpose(i)
    image = i.convert("RGB")
    image = np.array(image).astype(np.float32) / 255.0
    image = torch.from_numpy(image)[None,]
    if 'A' in i.getbands():
        mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
        mask = 1. - torch.from_numpy(mask)
    else:
        mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")
        return (image, mask.unsqueeze(0))

class VisualImageLoader():
    '''
    Javascript side needs to:
    - populate dropdown with image_list[x][0]
    - display image image_list[x][1] when the selection changes
    - have go button to submit the value 'x' and cancel button
    '''
    RETURN_TYPES = ("IMAGE","MASK","STRING",)
    RETURN_NAMES = ("image","mask","filename",)
    FUNCTION = "func"
    CATEGORY = "image_chooser"

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "directory" : {"STRING", {"default":""}}, 
            },
            "hidden": {"id":"UNIQUE_ID"},
        }

    def func(self, directory, id):
        image_list = copy_images_to_temp(directory)
        try:
            PromptServer.instance.send_sync("image-list", {"image_list":image_list})
        except Cancelled:
            return (None, None, "", )
        selection = MessageHolder.waitForMessage(id)
        image, mask = load_image(image_list[selection][1])
        return (image, mask, image_list[selection][0],)
    