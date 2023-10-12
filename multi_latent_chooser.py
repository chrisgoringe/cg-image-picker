import torch, json
from image_chooser_server import MessageHolder, Cancelled

class BaseChooser():
    CATEGORY = "utilities/control"
    FUNCTION = "func"
    def IS_CHANGED(self, **kwargs):
        return float('nan')
    
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
            msg = MessageHolder.waitForMessage(id)
            message = json.loads(msg)
            if not isinstance(message,dict):
                raise Exception(message)
        except Cancelled:
            return (None, None, "Cancelled")
        
        if message['mode']=="Discard Previous":
            self.positive = None
            self.negative = None

        for new_positive in [int(x.strip()) for x in message['positive'].split(",")]:
            new_positive = (new_positive-1) % batch_size
            self.positive = self.batch(self.positive, latents["samples"][new_positive])
        n_p = int(self.positive.shape[0]) if self.positive is not None else 0
        positive = self.positive if self.positive is not None else torch.zeros(latent_shape).unsqueeze_(0)

        for new_negative in [int(x.strip()) for x in message['negative'].split(",")]:
            new_negative = (new_negative-1) % batch_size
            self.negative = self.batch(self.negative, latents["samples"][new_negative])
        n_n = int(self.negative.shape[0]) if self.negative is not None else 0
        negative = self.negative if self.negative is not None else torch.zeros(latent_shape).unsqueeze_(0)

        return ({'samples':positive}, {'samples':negative}, )