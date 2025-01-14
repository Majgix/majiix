export async function byobReader(
  reader: ReadableStreamBYOBReader,
  buffer: ArrayBufferLike,
  offset: number,
  size: number,
): Promise<ArrayBuffer> {
  if (size <= 0) {
    return buffer;
  }
  let remainingSize = size;
  while (remainingSize > 0) {
    const { value, done } = await reader.read(
      new Uint8Array(buffer, offset, remainingSize),
    );
    if (value !== undefined) {
      buffer = value.buffer;
      offset += value.byteLength;
      remainingSize = remainingSize - value.byteLength;
    }
    if (done && remainingSize > 0) {
      throw new Error("short buffer");
    }
  }
  return buffer;
}

export function concatBuffer(arr: Uint8Array[]) {
  let totalLength = 0;
  arr.forEach((element) => {
    if (element !== undefined) {
      totalLength += element.byteLength;
    }
  });
  const retBuffer = new Uint8Array(totalLength);
  let pos = 0;
  arr.forEach((element) => {
    if (element !== undefined) {
      retBuffer.set(element, pos);
      pos += element.byteLength;
    }
  });
  return retBuffer;
}

export async function readUntilEof(
  readableStream: ReadableStream,
  blockSize: number,
) {
  const chunkArray = [];
  let totalLength = 0;

  while (true) {
    let bufferChunk = new Uint8Array(blockSize);
    const reader = readableStream.getReader({ mode: "byob" });
    const { value, done } = await reader.read(
      new Uint8Array(bufferChunk, 0, blockSize),
    );
    if (value !== undefined) {
      //bufferChunk = value.buffer
      bufferChunk.set(value);
      chunkArray.push(bufferChunk.slice(0, value.byteLength));
      totalLength += value.byteLength;
    }
    reader.releaseLock();
    if (value === undefined) {
      throw new Error("error reading incoming data");
    }
    if (done) {
      break;
    }
  }
  // Concatenate received data
  const payload = new Uint8Array(totalLength);
  let pos = 0;
  for (const element of chunkArray) {
    const uint8view = new Uint8Array(element, 0, element.byteLength);
    payload.set(uint8view, pos);
    pos += element.byteLength;
  }

  return payload;
}

export async function buffRead(readableStream: ReadableStream, size: number) {
  const ret = null;
  if (size <= 0) {
    return ret;
  }
  // let buff = new Uint8Array(Number(size))
  let buff: ArrayBuffer = new Uint8Array(Number(size));
  const reader = readableStream.getReader({ mode: "byob" });

  try {
    const readBuffer = await byobReader(reader, buff, 0, size);
    if (readBuffer === null) {
      throw new Error("Failed to read: Empty Stream Buffer");
    }
    buff = readBuffer;
  } finally {
    reader.releaseLock();
  }
  return buff;
}

export {};
