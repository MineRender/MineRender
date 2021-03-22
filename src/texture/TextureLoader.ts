import { PixelFormat, RGBAFormat, Texture } from "three";
import { Caching } from "../cache/Caching";
import * as THREE from "three";
import { ImageLoader } from "../image/ImageLoader";
import { createCanvas } from "../canvas/CanvasCompat";
import { CanvasRenderingContext2D } from "canvas";
import { Textures } from "./Textures";

export class TextureLoader {

    protected static createTexture(): Texture {
        return new Texture();
    }

    public static loadInBackground(src: string, format: PixelFormat = RGBAFormat, rotation: number = 0): Texture {
        const texture = this.createTexture();
        const image = ImageLoader.loadElement(src);
        image.onload = function () {
            texture.needsUpdate = true;
        }
        texture.image = image;
        texture.format = format;
        texture.rotation = rotation;

        return Textures.initTextureProps(texture);
    }

    public static load(src: string,format: PixelFormat = RGBAFormat, rotation: number = 0): Texture {
        const texture = new Texture();
        ImageLoader.getData(src).then(image=>{
            texture.needsUpdate = true;
            texture.image = image;
        })
        texture.format = format;
        texture.rotation = rotation;

        return Textures.initTextureProps(texture);
    }


}
