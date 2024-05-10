"""
@author: chrisgoringe
@title: Image Chooser
@nickname: Image Chooser
@description: Custom nodes that preview images and pause the workflow to allow the user to select one or more to progress
"""

import sys, os

sys.path.insert(0,os.path.dirname(os.path.realpath(__file__)))
from .image_chooser_preview import PreviewAndChoose, PreviewAndChooseDouble
module_root_directory = os.path.dirname(os.path.realpath(__file__))
module_js_directory = os.path.join(module_root_directory, "js")

NODE_CLASS_MAPPINGS = { 
    "Preview Chooser" : PreviewAndChoose,
    "Preview Chooser Fabric" : PreviewAndChooseDouble,
                      }

WEB_DIRECTORY = "./js"
__all__ = ["NODE_CLASS_MAPPINGS", "WEB_DIRECTORY"]

IP_VERSION = "2.13"
