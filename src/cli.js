/* global $, localStorage, Shell */

const errors = {
  invalidDirectory: 'Error: not a valid directory',
  noWriteAccess: 'Error: you do not have write access to this directory',
  fileNotFound: 'Error: file not found in current directory',
  fileNotSpecified: 'Error: you did not specify a file',
  invalidFile: 'Error: not a valid file',
};

const struct = {
  sconetto: ['about', 'resume', 'contact'],
  skills: ['proficient', 'familiar', 'learning'],
};

const commands = {};
let systemData = {};
const rootPath = '/home/sconetto';

const getDirectory = () => localStorage.directory;
const setDirectory = (dir) => {
  localStorage.directory = dir;
};

// Turn on fullscreen.
const registerFullscreenToggle = () => {
  $('.button.green').click(() => {
    $('.terminal-window').toggleClass('fullscreen');
  });
};
const registerMinimizedToggle = () => {
  $('.button.yellow').click(() => {
    $('.terminal-window').toggleClass('minimized');
  });
};

// Create new directory in current directory.
commands.mkdir = () => errors.noWriteAccess;

// Create new directory in current directory.
commands.touch = () => errors.noWriteAccess;

// Remove file from current directory.
commands.rm = () => errors.noWriteAccess;

// View contents of specified directory.
commands.ls = (directory) => {
  if (directory === '..' || directory === '~') {
    return systemData['sconetto'];
  }

  if (directory in struct) {
    return systemData[directory];
  }

  return systemData[getDirectory()];
};

// View contents of specified directory. (copy of ls)
commands.l = (directory) => {
  if (directory === '..' || directory === '~') {
    return systemData['sconetto'];
  }

  if (directory in struct) {
    return systemData[directory];
  }

  return systemData[getDirectory()];
};

// View list of possible commands.
commands.help = () => systemData.help;

// Display current path.
commands.path = () => {
  const dir = getDirectory();
  return dir === 'sconetto' ? rootPath : `${rootPath}/${dir}`;
};

// Display current path. (copy of path)
commands.pwd = () => {
  const dir = getDirectory();
  return dir === 'sconetto' ? rootPath : `${rootPath}/${dir}`;
};

// See command history.
commands.history = () => {
  let history = localStorage.history;
  history = history ? Object.values(JSON.parse(history)) : [];
  return `<p>${history.join('<br>')}</p>`;
};

// Move into specified directory.
commands.cd = (newDirectory) => {
  const currDir = getDirectory();
  const dirs = Object.keys(struct);
  const newDir = newDirectory ? newDirectory.trim() : '';

  if (dirs.includes(newDir) && currDir !== newDir) {
    setDirectory(newDir);
  } else if (newDir === '' || newDir === '~' || (newDir === '..' && dirs.includes(currDir))) {
    setDirectory('sconetto');
  } else {
    return errors.invalidDirectory;
  }
  return null;
};

// Display contents of specified file.
commands.cat = (filename) => {
  if (!filename) return errors.fileNotSpecified;

  const isADirectory = (filename) => struct.hasOwnProperty(filename);
  const hasValidFileExtension = (filename, extension) => filename.includes(extension);
  const isFileInDirectory = (filename) => (filename.split('/').length === 1 ? false : true);
  const isFileInSubdirectory = (filename, directory) => struct[directory].includes(filename);

  if (isADirectory(filename)) return errors.invalidFile;

  if (!isFileInDirectory(filename)) {
    const fileKey = filename.split('.')[0];
    const isValidFile = (filename) => systemData.hasOwnProperty(filename);

    if (isValidFile(fileKey) && hasValidFileExtension(filename, '.txt')) {
      return systemData[fileKey];
    }
  }

  if (isFileInDirectory(filename)) {
    if (hasValidFileExtension(filename, '.txt')) {
      const directories = filename.split('/');
      const directory = directories.slice(0, 1).join(',');
      const fileKey = directories.slice(1, directories.length).join(',').split('.')[0];
      if (directory === 'sconetto' || !struct.hasOwnProperty(directory))
        return errors.noSuchFileOrDirectory;

      return isFileInSubdirectory(fileKey, directory)
        ? systemData[fileKey]
        : errors.noSuchFileOrDirectory;
    }

    return errors.noSuchFileOrDirectory;
  }

  return errors.fileNotFound;
};

// Initialize cli.
$(() => {
  registerFullscreenToggle();
  registerMinimizedToggle();
  const cmd = document.getElementById('terminal');

  $.ajaxSetup({ cache: false });
  const pages = [];
  pages.push($.get('pages/about.html'));
  pages.push($.get('pages/contact.html'));
  pages.push($.get('pages/familiar.html'));
  pages.push($.get('pages/help.html'));
  pages.push($.get('pages/learning.html'));
  pages.push($.get('pages/proficient.html'));
  pages.push($.get('pages/resume.html'));
  pages.push($.get('pages/root.html'));
  pages.push($.get('pages/skills.html'));
  $.when
    .apply($, pages)
    .done(
      (
        aboutData,
        contactData,
        familiarData,
        helpData,
        learningData,
        proficientData,
        resumeData,
        sconettoData,
        skillsData,
      ) => {
        systemData['about'] = aboutData[0];
        systemData['contact'] = contactData[0];
        systemData['familiar'] = familiarData[0];
        systemData['help'] = helpData[0];
        systemData['learning'] = learningData[0];
        systemData['proficient'] = proficientData[0];
        systemData['resume'] = resumeData[0];
        systemData['sconetto'] = sconettoData[0];
        systemData['skills'] = skillsData[0];
      },
    );

  const terminal = new Shell(cmd, commands);
});
