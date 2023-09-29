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
                      }

__all__ = ['NODE_CLASS_MAPPINGS']

shutil.copytree(module_js_directory, application_web_extensions_directory, dirs_exist_ok=True)
