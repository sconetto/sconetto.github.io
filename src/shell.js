/* global $, localStorage */

class Shell {
  constructor(term, commands, pageNames) {
    this.commands = commands;
    this.pageNames = pageNames || [];
    this.setupListeners(term);
    this.term = term;
    this.easter_count = 0;

    localStorage.directory = 'sconetto';
    localStorage.history = JSON.stringify('');
    localStorage.historyIndex = -1;
    localStorage.inHistory = false;

    $('.input').focus();
  }

  setupListeners(term) {
    $('#terminal').mouseup(() => $('.input').last().focus());

    term.addEventListener('keyup', (evt) => {
      const keyUp = 38;
      const keyDown = 40;
      const key = evt.keyCode;

      if ([keyUp, keyDown].includes(key)) {
        let history = localStorage.history;
        history = history ? Object.values(JSON.parse(history)) : [];

        if (key === keyUp) {
          if (localStorage.historyIndex >= 0) {
            if (localStorage.inHistory == 'false') {
              localStorage.inHistory = true;
            }
            // Prevent repetition of last command while traversing history.
            if (localStorage.historyIndex == history.length - 1 && history.length !== 1) {
              localStorage.historyIndex -= 1;
            }
            $('.input')
              .last()
              .html(`${history[localStorage.historyIndex]}<span class="end"><span>`);
            if (localStorage.historyIndex != 0) localStorage.historyIndex -= 1;
          }
        } else if (key === keyDown) {
          if (localStorage.inHistory == 'true' && localStorage.historyIndex < history.length) {
            let ret;

            if (localStorage.historyIndex > 0) {
              ret = `${history[localStorage.historyIndex]}<span class="end"><span>`;
              if (localStorage.historyIndex !== history.length - 1) {
                localStorage.historyIndex = Number(localStorage.historyIndex) + 1;
              }
              // Prevent repetition of first command while traversing history.
            } else if (localStorage.historyIndex === 0 && history.length > 1) {
              ret = `${history[1]}<span class="end"><span>`;
              localStorage.historyIndex = history.length !== 2 ? 2 : 1;
            }
            $('.input').last().html(ret);
          }
        }
        evt.preventDefault();
        $('.end').focus();
      }
    });

    term.addEventListener('keydown', (evt) => {
      // Keydown legend:
      // 9 -> Tab key.
      // 27 -> Escape key.
      // 8 -> Backspace key.
      // 46 -> Delete key.
      // 67 -> 'C' key.

      if (evt.keyCode === 9) {
        evt.preventDefault();
        const target = $('.input').last()[0];
        if (!target) return;

        let found = false;
        const selection = window.getSelection();
        const range = document.createRange();

        // Get text content for comparison (handles both regular spaces and &nbsp;)
        const textContent = target.textContent || '';
        const trimmedText = textContent.trim();
        const hasSpace = trimmedText.indexOf(' ') >= 0;

        if (hasSpace) {
          // Extract the part after the last space for autocompletion
          const textParts = trimmedText.split(/\s+/);
          const baseArg = textParts[textParts.length - 1] || '';
          const prefix = textParts.slice(0, -1).join(' ') + ' ';

          // Check if baseArg contains a slash (directory path)
          if (baseArg.indexOf('/') >= 0) {
            // Already in a directory path, match against full paths
            this.pageNames.forEach((pageName) => {
              if (pageName.startsWith(baseArg) && !found) {
                target.innerHTML = prefix + pageName + '&nbsp;';
                selection.removeAllRanges();
                range.selectNodeContents(target);
                range.collapse(false);
                selection.addRange(range);
                target.focus();
                found = true;
              }
            });
          } else {
            // Find all page names that start with baseArg
            const matchingPages = this.pageNames.filter((pageName) => pageName.startsWith(baseArg));

            // Check if any matching pages are in directories (contain a slash)
            const directoryPages = matchingPages.filter((pageName) => pageName.indexOf('/') >= 0);

            if (directoryPages.length > 0 && !found) {
              // Extract the directory part (everything up to the first slash)
              const firstMatch = directoryPages[0];
              const slashIndex = firstMatch.indexOf('/');
              const directoryName = firstMatch.substring(0, slashIndex);

              // Check if the directory name starts with baseArg (to handle partial matches like "sk" -> "skills")
              if (directoryName.startsWith(baseArg)) {
                // Extract the command from prefix (remove trailing space)
                const command = prefix.trim().toLowerCase();
                // Only add forward slash for cat and ls commands
                const addSlash = command === 'cat' || command === 'ls';
                const suffix = addSlash ? '/' : '';
                target.innerHTML = prefix + directoryName + suffix;
                selection.removeAllRanges();
                range.selectNodeContents(target);
                range.collapse(false);
                selection.addRange(range);
                target.focus();
                found = true;
              }
            }

            // If no directory match, try to autocomplete with page names (non-directory paths)
            if (!found) {
              this.pageNames.forEach((pageName) => {
                if (pageName.startsWith(baseArg) && pageName.indexOf('/') < 0 && !found) {
                  target.innerHTML = prefix + pageName + '&nbsp;';
                  selection.removeAllRanges();
                  range.selectNodeContents(target);
                  range.collapse(false);
                  selection.addRange(range);
                  target.focus();
                  found = true;
                }
              });
            }
          }
        } else {
          // No space - try commands first, then page names
          const baseText = trimmedText;

          // Try commands first
          Object.keys(this.commands).every((element) => {
            if (element.startsWith(baseText)) {
              target.innerHTML = element + '&nbsp;';
              selection.removeAllRanges();
              range.selectNodeContents(target);
              range.collapse(false);
              selection.addRange(range);
              target.focus();
              found = true;
              return false;
            }
            return true;
          });

          // If no command match, try page names
          if (!found) {
            // Check if baseText contains a slash (directory path)
            if (baseText.indexOf('/') >= 0) {
              // Already in a directory path, match against full paths
              this.pageNames.forEach((pageName) => {
                if (pageName.startsWith(baseText) && !found) {
                  target.innerHTML = pageName + '&nbsp;';
                  selection.removeAllRanges();
                  range.selectNodeContents(target);
                  range.collapse(false);
                  selection.addRange(range);
                  target.focus();
                  found = true;
                }
              });
            } else {
              // Find all page names that start with baseText
              const matchingPages = this.pageNames.filter((pageName) =>
                pageName.startsWith(baseText),
              );

              // Check if any matching pages are in directories (contain a slash)
              const directoryPages = matchingPages.filter((pageName) => pageName.indexOf('/') >= 0);

              if (directoryPages.length > 0 && !found) {
                // Extract the directory part (everything up to the first slash)
                const firstMatch = directoryPages[0];
                const slashIndex = firstMatch.indexOf('/');
                const directoryName = firstMatch.substring(0, slashIndex);

                // Check if the directory name starts with baseText (to handle partial matches like "sk" -> "skills")
                if (directoryName.startsWith(baseText)) {
                  // No command context, so don't add forward slash
                  target.innerHTML = directoryName + '&nbsp;';
                  selection.removeAllRanges();
                  range.selectNodeContents(target);
                  range.collapse(false);
                  selection.addRange(range);
                  target.focus();
                  found = true;
                }
              }

              // If no directory match, try to autocomplete with page names (non-directory paths)
              if (!found) {
                this.pageNames.forEach((pageName) => {
                  if (pageName.startsWith(baseText) && pageName.indexOf('/') < 0 && !found) {
                    target.innerHTML = pageName + '&nbsp;';
                    selection.removeAllRanges();
                    range.selectNodeContents(target);
                    range.collapse(false);
                    selection.addRange(range);
                    target.focus();
                    found = true;
                  }
                });
              }
            }
          }
        }
      } else if (evt.keyCode === 27 && evt.ctrlKey && evt.shiftKey && this.easter_count < 3) {
        this.term.innerHTML += '<p>what are you trying to do? ;P</p>';
        this.easter_count += 1;
        const prompt = evt.target;
        this.resetPrompt(term, prompt);
      } else if (evt.keyCode === 27 && !evt.ctrlKey && !evt.shiftKey) {
        $('.terminal-window').toggleClass('fullscreen');
      } else if (evt.keyCode === 8 || evt.keyCode === 46) {
        this.resetHistoryIndex();
      } else if (evt.keyCode === 67 && evt.ctrlKey) {
        const prompt = evt.target;
        this.resetPrompt(term, prompt);
      }
    });

    term.addEventListener('keypress', (evt) => {
      // Exclude these keys for Firefox, as they're fired for arrow/tab keypresses.
      if (![9, 27, 37, 38, 39, 40].includes(evt.keyCode)) {
        // If input keys are pressed then resetHistoryIndex() is called.
        this.resetHistoryIndex();
      }
      if (evt.keyCode === 13) {
        const prompt = evt.target;
        const input = prompt.textContent.trim().split(' ');
        const cmd = input[0].toLowerCase();
        const args = input[1];

        if (cmd === 'clear') {
          this.updateHistory(cmd);
          this.clearConsole();
        } else if (cmd && cmd in this.commands) {
          this.runCommand(cmd, args);
          this.resetPrompt(term, prompt);
          $('.root').last().html(localStorage.directory);
        } else if (cmd === '') {
          this.resetPrompt(term, prompt);
        } else {
          this.term.innerHTML += 'Error: command not recognized';
          this.resetPrompt(term, prompt);
        }
        evt.preventDefault();
      }
    });
  }

  runCommand(cmd, args) {
    const command = args ? `${cmd} ${args}` : cmd;
    this.updateHistory(command);

    const output = this.commands[cmd](args);
    if (output) {
      this.term.innerHTML += output;
    }
  }

  resetPrompt(term, prompt) {
    const newPrompt = prompt.parentNode.cloneNode(true);
    prompt.setAttribute('contenteditable', false);

    if (this.prompt) {
      newPrompt.querySelector('.prompt').textContent = this.prompt;
    }

    term.appendChild(newPrompt);
    newPrompt.querySelector('.input').innerHTML = '';
    newPrompt.querySelector('.input').focus();
  }

  resetHistoryIndex() {
    let history = localStorage.history;

    history = history ? Object.values(JSON.parse(history)) : [];
    if (localStorage.goingThroughHistory == true) {
      localStorage.goingThroughHistory = false;
    }

    if (history.length == 0) {
      localStorage.historyIndex = -1;
    } else {
      localStorage.historyIndex = history.length - 1 > 0 ? history.length - 1 : 0;
    }
  }

  updateHistory(command) {
    let history = localStorage.history;
    history = history ? Object.values(JSON.parse(history)) : [];

    history.push(command);
    localStorage.history = JSON.stringify(history);
    localStorage.historyIndex = history.length - 1;
  }

  clearConsole() {
    const getDirectory = () => localStorage.directory;
    const dir = getDirectory();

    $('#terminal').html(
      `<p class="hidden">
          <span class="prompt">
            <span class="user">admin</span><span> @ </span><span class="host">shell</span>
            <span>in </span><span class="root">${dir}</span>
            <span class="tick">➜</span>
          </span>
          <span contenteditable="true" class="input" spellcheck="false"></span>
        </p>`,
    );

    $('.input').focus();
  }
}
