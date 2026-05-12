enum AudioContexts {
  CreatePost,
  EditPost,
  LikePost,
  DeletePost,
  Notification,
  NewPost
};

const DEFAULT_AUDIO_CONFIG: { [key in AudioContexts]: AudioConfig } = {
  [AudioContexts.CreatePost]: {
    file: "pop2-e5a5.mp3",
    volume: 1
  },
  [AudioContexts.EditPost]: {
    file: "pop2-e5a5.mp3",
    volume: 1
  },
  [AudioContexts.LikePost]: {
    file: "pop2-e5.mp3",
    volume: 0.25
  },
  [AudioContexts.DeletePost]: {
    file: "pop2-e5.mp3",
    volume: 1,
    disable: true
  },
  [AudioContexts.Notification]: {
    file: "pop-e5.mp3",
    volume: 1
  },
  [AudioContexts.NewPost]: {
    file: "pop-e5a5.mp3",
    volume: 1,
    disable: true
  }
};

function getAudio(context: AudioContexts | AudioConfig): Ael {
  let config: AudioConfig | null = null;

  if (typeof context === "object") {
    config = context;
  } else {
    let ls: { [key: string]: AudioConfig } = JSON.parse(localStorage.getItem("smiggins-sounds") || "{}") || {};
    config = ls[AudioContexts[context]];

    if (!config) {
      config = DEFAULT_AUDIO_CONFIG[context];
    }
  }

  if (config.disable) {
    return null;
  }

  let audio: A = new Audio(AUDIO_URL + "/" + config.file);
  audio.volume = config.volume;
  return audio;
}

function updateAudioConfig(context: AudioContexts, config: AudioConfig, playSample: boolean=true): void {
  let ls: { [key: string]: AudioConfig } = JSON.parse(localStorage.getItem("smiggins-sounds") || "{}") || {};
  ls[context] = config;
  localStorage.setItem("smiggins-sounds", JSON.stringify(ls));

  audioContexts[context] = getAudio(config);

  if (playSample) {
    playSound(context);
  }
}

function playSound(context: AudioContexts): void {
  let a: Ael = audioContexts[context];

  if (a) {
    a.currentTime = 0;
    a.play();
  }
}

let audioContexts: { [key in AudioContexts]: Ael } = {
  [AudioContexts.CreatePost]: getAudio(AudioContexts.CreatePost),
  [AudioContexts.EditPost]: getAudio(AudioContexts.EditPost),
  [AudioContexts.LikePost]: getAudio(AudioContexts.LikePost),
  [AudioContexts.DeletePost]: getAudio(AudioContexts.DeletePost),
  [AudioContexts.Notification]: getAudio(AudioContexts.Notification),
  [AudioContexts.NewPost]: getAudio(AudioContexts.NewPost)
};
