import sys, os, shutil
import folder_paths

sys.path.insert(0,os.path.dirname(os.path.realpath(__file__)))
from .image_chooser_preview import PreviewAndChoose
module_root_directory = os.path.dirname(os.path.realpath(__file__))
module_js_directory = os.path.join(module_root_directory, "js")

NODE_CLASS_MAPPINGS = { 
    "Preview Chooser" : PreviewAndChoose,
                      }

__all__ = ['NODE_CLASS_MAPPINGS']

IP_VERSION = "2.5.2"
CLEAN = False

application_root_directory = os.path.dirname(folder_paths.__file__)
extension_web_extensions_directory = os.path.join(application_root_directory, "web", "extensions", "image_chooser")
if os.path.exists(extension_web_extensions_directory):
    shutil.rmtree(extension_web_extensions_directory)
shutil.copytree(module_js_directory, extension_web_extensions_directory, dirs_exist_ok=True)

old_web_extensions_directory = os.path.join(application_root_directory, "web", "extensions", "cg-nodes", "cg_image_picker")
if os.path.exists(old_web_extensions_directory):
    shutil.rmtree(old_web_extensions_directory)
