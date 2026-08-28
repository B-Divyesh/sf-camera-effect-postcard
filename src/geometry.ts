export type Crop = { sx: number; sy: number; sw: number; sh: number };
export type Box = { x: number; y: number; width: number; height: number };

export function coverCrop(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): Crop {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    const sw = sourceHeight * targetRatio;
    return { sx: (sourceWidth - sw) / 2, sy: 0, sw, sh: sourceHeight };
  }
  const sh = sourceWidth / targetRatio;
  return { sx: 0, sy: (sourceHeight - sh) / 2, sw: sourceWidth, sh };
}

export function mapFaceBox(box: Box, crop: Crop, width: number, height: number, mirrored: boolean): Box {
  let x = ((box.x - crop.sx) / crop.sw) * width;
  const mappedWidth = (box.width / crop.sw) * width;
  if (mirrored) x = width - x - mappedWidth;
  return {
    x,
    y: ((box.y - crop.sy) / crop.sh) * height,
    width: mappedWidth,
    height: (box.height / crop.sh) * height
  };
}
