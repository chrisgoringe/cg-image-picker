import sys, os, shutil

sys.path.insert(0,os.path.dirname(os.path.realpath(__file__)))
from .image_chooser import *
from custom_nodes.cg_custom_core.base import application_web_extensions_directory
module_root_directory = os.path.dirname(os.path.realpath(__file__))
module_js_directory = os.path.join(module_root_directory, "js")

NODE_CLASS_MAPPINGS = { 
    "Image Chooser" : ImageChooser,
    "Preview for Image Chooser" : PreviewImageChooser,
    "Latent Chooser" : LatentChooser,
    "Multi Latent Chooser" : MultiLatentChooser,
                      }

__all__ = ['NODE_CLASS_MAPPINGS']

IP_VERSION = 2.3

shutil.copytree(module_js_directory, os.path.join(application_web_extensions_directory,"..","cg_image_picker"), dirs_exist_ok=True)

try:
    from custom_nodes.cg_custom_core import CC_VERSION
    if CC_VERSION < 2.2:
        raise Exception()
except:
    print("cg_custom_core 2.2 not found - will try to install - you may need to restart afterwards")
    from .install import installer
    import os
    import folder_paths
    application_root_directory = os.path.dirname(folder_paths.__file__)
    installer(os.path.join(application_root_directory,"custom_nodes"))