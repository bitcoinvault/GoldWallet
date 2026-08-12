import { spawn } from 'child_process';

export const runStreamingChildProcess = ({
  command,
  args,
  cwd,
  env,
  maxBuffer = 64 * 1024 * 1024,
  onSpawn = () => {},
  forwardOutput = true,
  spawnProcess = spawn,
}) =>
  new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let outputLimitExceeded = false;
    let processError;
    let settled = false;
    const child = spawnProcess(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const finish = (status, signal) => {
      if (settled) return;
      settled = true;
      resolve({ status, signal, stdout, stderr, error: processError });
    };

    const capture = (chunk, streamName) => {
      const text = chunk.toString();
      outputBytes += Buffer.byteLength(text);
      if (forwardOutput) process[streamName].write(text);

      if (outputBytes > maxBuffer && !outputLimitExceeded) {
        outputLimitExceeded = true;
        processError = new Error(`Child process output exceeded ${maxBuffer} bytes.`);
      }

      if (outputLimitExceeded) return;

      if (streamName === 'stdout') stdout += text;
      else stderr += text;
    };

    child.stdout?.on('data', chunk => capture(chunk, 'stdout'));
    child.stderr?.on('data', chunk => capture(chunk, 'stderr'));
    child.on('error', error => {
      processError = error;
    });
    child.on('close', (status, signal) => finish(status, signal));

    try {
      if (!Number.isInteger(child.pid) || child.pid <= 0) {
        throw new Error(`Child process did not provide a valid PID: ${child.pid}`);
      }
      onSpawn(child.pid);
    } catch (error) {
      processError = error;
      child.kill();
    }
  });
