import readline from 'readline';

/**
 * Prompts the user for sensitive input without echoing keystrokes to stdout.
 * Gracefully falls back to standard readline if stdin is not a TTY.
 */
export async function promptHidden(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(promptText);

    const stdin = process.stdin;
    if (!stdin.isTTY) {
      const rl = readline.createInterface({
        input: stdin,
        output: process.stdout,
      });
      rl.question('', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let input = '';
    const onData = (ch: string) => {
      switch (ch) {
        case '\n':
        case '\r':
        case '\u0004': // EOF
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          process.exit(130);
          break;
        case '\b':
        case '\x7f': // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
          }
          break;
        default:
          input += ch;
          break;
      }
    };

    stdin.on('data', onData);
  });
}
