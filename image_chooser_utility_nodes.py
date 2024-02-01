from nodes import SaveImage

class SafeSaveImage(SaveImage):
    def save_images(self, images, **kwargs):
        if images is not None: return SaveImage.save_images(images, **kwargs)
        return ()