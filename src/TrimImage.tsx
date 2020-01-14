import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const getBaseName = (str: string): string => {
  var base = str.substring(str.lastIndexOf('/') + 1);
  if(base.lastIndexOf(".") !== -1) {
    base = base.substring(0, base.lastIndexOf("."))
  };
  return base;
}

const useInputFile = () => {
  const [image, setImage] = useState<{
    preview: string;
    raw: File | null;
    fileName: string;
  }>({ preview: '', raw: null, fileName: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const { createObjectURL } = window.URL || window.webkitURL;

  const onChangeFile = () => {
    if (fileRef.current && fileRef.current.files) {
      const imageUrl = createObjectURL(fileRef.current.files[0]);
      setImage({
        preview: imageUrl,
        raw: fileRef.current.files[0],
        fileName: getBaseName(fileRef.current.files[0].name),
      });
    }
  };

  return { fileRef, onChangeFile, image };
};

const ImageCroppingModal: React.FC = () => {
  const { fileRef, onChangeFile, image } = useInputFile();

  return (
    <div>
      <input
        id="file"
        ref={fileRef}
        type="file"
        accept="image/png,image/jpg,image/jpeg"
        onChange={onChangeFile}
      />
      {image.raw && <TestDes imageUrl={image.preview} fileName={image.fileName} />}
    </div>
  );
};

const inputCanvas = { width: 400, height: 400 };
const outCanvas = { width: 300, height: 300 };

const TestDes: React.FC<{ imageUrl: string; fileName: string }> = ({
  imageUrl,
  fileName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageSize = useRef({ width: 0, height: 0 });
  const scaleRef = useRef(0);
  const imageCenterC = useRef({ width: 0, height: 0 });
  const [scale, setScale] = useState(0);
  const mouseDown = useRef(false);

  const img = useRef<HTMLImageElement>(new Image());

  const drawCanvas = (_x: number, _y: number) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.fillRect(0, 0, inputCanvas.width, inputCanvas.height); // 背景を塗る
      ctx.drawImage(
        img.current,
        0,
        0,
        imageSize.current.width,
        imageSize.current.height,
        inputCanvas.width / 2 - _x * scaleRef.current,
        inputCanvas.height / 2 - _y * scaleRef.current,
        imageSize.current.width * scaleRef.current,
        imageSize.current.height * scaleRef.current,
      );
      ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        (inputCanvas.width - outCanvas.width) / 2,
        (inputCanvas.height - outCanvas.height) / 2,
        outCanvas.width,
        outCanvas.height,
      );
    }
  };

  img.current.onload = () => {
    // imageの中心位置をstateに保存
    imageCenterC.current = {
      width: img.current.width / 2,
      height: img.current.height / 2,
    };

    // imageの画像サイズをstateに保存
    imageSize.current = {
      width: img.current.width,
      height: img.current.height,
    };

    // スケーリング
    const scl = Number((inputCanvas.width / img.current.width) * 100);
    setScale(scl);
    scaleRef.current = scl * 0.01;

    // 描画
    drawCanvas(img.current.width / 2, img.current.height / 2);
  };

  useEffect(() => {
    img.current.src = imageUrl;
  }, [imageUrl]);

  // 拡大縮小率
  const onChangeScale = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setScale(v)
    scaleRef.current = v * 0.01;
    drawCanvas(imageCenterC.current.width, imageCenterC.current.height);
  };

  const sx = useRef(0); // canvas ドラッグ開始位置
  const sy = useRef(0);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    mouseDown.current = true;
    sx.current = e.pageX;
    sy.current = e.pageY;
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (mouseDown.current === false) return;
    mouseDown.current = false;
    drawCanvas(
      (imageCenterC.current.width += (sx.current - e.pageX) / scaleRef.current),
      (imageCenterC.current.height += (sy.current - e.pageY) / scaleRef.current),
    );
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (mouseDown.current === false) return;
    drawCanvas(
      imageCenterC.current.width + (sx.current - e.pageX) / scaleRef.current,
      imageCenterC.current.height + (sy.current - e.pageY) / scaleRef.current,
    );
  };

  const cropImg = () => {
    if (outCanvasRef.current) {
      const ctx = outCanvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height); // 背景を塗る
      ctx.drawImage(
        img.current,
        0,
        0,
        img.current.width,
        img.current.height,
        outCanvas.width / 2 - imageCenterC.current.width * scaleRef.current,
        outCanvas.height / 2 - imageCenterC.current.height * scaleRef.current,
        img.current.width * scaleRef.current,
        img.current.height * scaleRef.current,
      );
    }
  };

  const handleToData = () => {
    if (outCanvasRef.current) {
      // canvas -> base64
      const base64 = outCanvasRef.current.toDataURL('image/png');
      // base64 -> binary
      const bin = atob(base64.replace(/^.*,/, ''));
      const buffer = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
          buffer[i] = bin.charCodeAt(i);
      }
      // binary -> Blob
      const blob = new Blob(
        [buffer.buffer],
        { type: 'image/png' }
      );
      // binary -> File
      const file = new File(
        [buffer.buffer],
        `${fileName}.png`,
        { type: 'image/png' }
      );

      console.log('切り取ったファイルを変換しました。結果: ');
      console.log('to base64 data: ', base64);
      console.log('to blob: ', blob);
      console.log('to file: ', file);
    }
  };

  const scaling = ( _v: number ) => {
    scaleRef.current = _v * 0.01;
    drawCanvas( imageCenterC.current.width, imageCenterC.current.height );
  }

  const onWheel = (e: React.WheelEvent) => {
    // どの方向にスクロールしても拡大縮小する
    let scl = scale + ((e.deltaY + e.deltaX + e.deltaZ) * 0.05);
    if ( scl < 10  ) scl = 10
    if ( scl > 400 ) scl = 400
    setScale(scl);
    scaling(scl);
  }

  return (
    <>
      <div>ファイルを読み込んだよ！切り抜きをしてみてね</div>
      <ImageWrapper>
        <BeforeTrim>
          <input
            id="scal"
            type="range"
            value={scale}
            min="10"
            max="400"
            onChange={onChangeScale}
            style={{ width: '300px' }}
          />
          <br />
          <canvas
            id="canvas"
            ref={canvasRef}
            width={inputCanvas.width}
            height={inputCanvas.height}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onWheel={onWheel}
          />
          <br />
          <button type="button" onClick={cropImg}>
            切り取り
          </button>
        </BeforeTrim>
        <AfterTrim>
          <canvas
            id="out"
            ref={outCanvasRef}
            width={outCanvas.width}
            height={outCanvas.height}
          />
          <br/>
          <button type="button" onClick={handleToData}>
            保存
          </button>
          <p>保存ボタンを押したら結果がconsoleに出力されます</p>
        </AfterTrim>
      </ImageWrapper>
    </>
  );
};

const ImageWrapper = styled.div``;
const BeforeTrim = styled.div``;
const AfterTrim = styled.div``;

export default ImageCroppingModal;
