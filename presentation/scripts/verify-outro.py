"""Decode all frames, verify duration/format, inspect transitions, export real video endpoints."""
from pathlib import Path
import json
import cv2
import numpy as np

output = Path('output')
video = output / 'jana-from-request-to-result.mp4'
capture = cv2.VideoCapture(str(video))
assert capture.isOpened(), 'Cannot open rendered MP4'
fps = capture.get(cv2.CAP_PROP_FPS)
size = (int(capture.get(cv2.CAP_PROP_FRAME_WIDTH)), int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)))
declared_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
codec = ''.join(chr((int(capture.get(cv2.CAP_PROP_FOURCC)) >> (8 * i)) & 0xFF) for i in range(4))
assert size == (1920, 1080), size
assert abs(fps - 30) < .001, fps
assert declared_count == 900, declared_count
assert codec in ('avc1', 'h264', 'H264'), codec
count = 0
dark_frames = []
differences = []
previous = None
last_frames = []
while True:
    ok, frame = capture.read()
    if not ok:
        break
    gray = cv2.cvtColor(cv2.resize(frame, (320, 180)), cv2.COLOR_BGR2GRAY)
    if float(gray.mean()) < 10 or float((gray > 45).mean()) < .001:
        dark_frames.append(count)
    if previous is not None:
        differences.append(float(np.abs(gray.astype(np.float32) - previous).mean()))
    previous = gray.astype(np.float32)
    if count == 0:
        cv2.imwrite(str(output / 'first-frame.png'), frame)
    if count >= 840:
        last_frames.append(gray.astype(np.float32))
    count += 1
capture.set(cv2.CAP_PROP_POS_FRAMES, 899)
ok, last = capture.read()
assert ok
cv2.imwrite(str(output / 'last-frame.png'), last)
capture.release()
assert count == 900, count
assert not dark_frames, dark_frames
ending_motion = max(float(np.abs(a - last_frames[0]).mean()) for a in last_frames)
assert ending_motion < .6, ending_motion
report = {'video': video.name, 'codec': codec, 'width': size[0], 'height': size[1], 'fps': fps, 'decodedFrames': count, 'durationSeconds': count / fps, 'blackOrEmptyFrames': dark_frames, 'maxAdjacentFrameMeanDifference': max(differences), 'finalTwoSecondsMeanDifferenceMax': ending_motion, 'firstFrame': 'first-frame.png', 'lastFrame': 'last-frame.png'}
(output / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
