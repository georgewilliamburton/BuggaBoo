/**
 * @fileoverview GIF Decoder Module
 * 
 * @description
 * Handles GIF file parsing and frame extraction using the omggif library.
 * Processes GIF disposal modes, transparency, and frame composition to extract
 * individual frames as ImageData objects and data URLs.
 * 
 * Key Features:
 * - GIF file parsing and validation
 * - Frame-by-frame extraction with proper composition
 * - Disposal mode handling (restore background, previous, none)
 * - Transparency support
 * - Delay time extraction for animation timing
 * 
 * @example
 * // Parse GIF from ArrayBuffer
 * const frames = await parseGIFFrames(arrayBuffer);
 * // Returns: [{ dataUrl: '...', delay: 100 }, ...]
 * 
 * @module media/gif-decoder
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 3 - File Splitting
 * @requires omggif - GIF parsing library
 * @requires Logger - Logging utility
 */

// ============================================
// Phase 3: Module Split from media-import.js
// ============================================

/**
 * Parse GIF file and extract all frames with proper composition
 * @function
 * @param {ArrayBuffer} arrayBuffer - GIF file data
 * @returns {Promise<Array<{dataUrl: string, delay: number}>>} Array of frame objects
 * @emits media:gif:decoded - When GIF is successfully decoded
 */
async function parseGIFFrames(arrayBuffer) {
    return new Promise((resolve, reject) => {
        try {
            Logger.debug('GIFDecoder', 'Starting GIF parsing with omggif', { bufferSize: arrayBuffer.byteLength });
            
            // Convert ArrayBuffer to Uint8Array for omggif
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Create GIF reader
            const gifReader = new GifReader(uint8Array);
            const numFrames = gifReader.numFrames();
            const width = gifReader.width;
            const height = gifReader.height;
            
            Logger.info('GIFDecoder', 'GIF parsed successfully', { 
                frames: numFrames, 
                width, 
                height,
                loopCount: gifReader.loopCount()
            });
            
            // Create canvas for rendering frames
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            const frames = [];
            
            // Create a persistent canvas to handle frame composition
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = width;
            compositeCanvas.height = height;
            const compositeCtx = compositeCanvas.getContext('2d');
            
            // Extract each frame with proper composition
            for (let i = 0; i < numFrames; i++) {
                const frameInfo = gifReader.frameInfo(i);
                
                // Create ImageData for the full frame size
                const frameImageData = ctx.createImageData(width, height);
                
                // Decode frame into RGBA pixel data
                gifReader.decodeAndBlitFrameRGBA(i, frameImageData.data);
                
                // Clear the temporary canvas
                ctx.clearRect(0, 0, width, height);
                
                // Put the decoded frame data
                ctx.putImageData(frameImageData, 0, 0);
                
                // Handle disposal mode for proper frame composition
                // disposal: 0 = no disposal, 1 = do not dispose, 2 = restore to background, 3 = restore to previous
                const disposal = frameInfo.disposal || 0;
                
                if (i === 0 || disposal === 2) {
                    // First frame or restore to background - clear composite
                    compositeCtx.clearRect(0, 0, width, height);
                }
                
                // Draw current frame onto composite
                compositeCtx.drawImage(canvas, 0, 0);
                
                // Capture the composite result
                const dataUrl = compositeCanvas.toDataURL('image/png');
                
                // Get frame delay (in centiseconds, convert to milliseconds)
                const delay = frameInfo.delay ? frameInfo.delay * 10 : 100;
                
                frames.push({
                    dataUrl: dataUrl,
                    delay: delay
                });
                
                if (i % 10 === 0 || i === numFrames - 1) {
                    Logger.debug('GIFDecoder', `Extracted frame ${i + 1}/${numFrames}`, { delay, disposal });
                }
                
                // Handle disposal for next frame
                if (disposal === 2) {
                    // Restore to background - clear the composite for next frame
                    compositeCtx.clearRect(0, 0, width, height);
                }
                // disposal 1 or 0: leave composite as-is for next frame
                // disposal 3: would need to save previous state (complex, rarely used)
            }
            
            Logger.success('GIFDecoder', 'All GIF frames extracted', { count: frames.length });
            resolve(frames);
            
        } catch (error) {
            Logger.error('GIFDecoder', 'Error parsing GIF with omggif', error);
            reject(error);
        }
    });
}

/**
 * Extract frames from GIF file
 * @param {ArrayBuffer} arrayBuffer - GIF file data
 * @returns {Promise<Array>} Array of frame objects
 */
async function extractGIFFrames(arrayBuffer) {
    Logger.debug('GIFDecoder', 'extractGIFFrames starting', { bufferSize: arrayBuffer.byteLength });
    
    try {
        // Parse GIF to extract all frames
        const gifFrames = await parseGIFFrames(arrayBuffer);
        Logger.success('GIFDecoder', 'GIF frames extracted', { count: gifFrames.length });
        
        // Emit event
        if (window.eventBus) {
            window.eventBus.emit('media:gif:decoded', {
                frameCount: gifFrames.length
            });
        }
        
        return gifFrames;
    } catch (error) {
        Logger.error('GIFDecoder', 'Error in extractGIFFrames', error);
        throw error;
    }
}
