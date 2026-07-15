import { createApp, ref } from 'vue';
import './style.css';

declare global {
  interface Window {
    scp?: {
      storage: {
        get(key: string): Promise<string | null>;
        set(key: string, value: string): Promise<boolean>;
      };
      theme: {
        getCurrent(): Promise<{ name?: string; accent?: string }>;
      };
      window: {
        setTitle(title: string): Promise<boolean>;
      };
    };
  }
}

const App = {
  setup() {
    const note = ref('');
    const status = ref('Ready');
    const themeName = ref('Unknown');

    async function load() {
      note.value = (await window.scp?.storage.get('note')) ?? '';
      const theme = await window.scp?.theme.getCurrent();
      themeName.value = theme?.name ?? 'Unknown';
      status.value = 'Loaded from SCP-OS API';
    }

    async function save() {
      await window.scp?.storage.set('note', note.value);
      await window.scp?.window.setTitle(note.value ? `Vue Demo - ${note.value.slice(0, 18)}` : 'Vue Demo');
      status.value = 'Saved';
    }

    void load();
    return { note, status, themeName, save };
  },
  template: `
    <main class="shell">
      <section class="panel">
        <p class="eyebrow">SCP-OS Local App</p>
        <h1>Vue/Vite Demo</h1>
        <p class="meta">Theme: {{ themeName }}</p>
        <label>
          Note
          <textarea v-model="note" placeholder="Write something local"></textarea>
        </label>
        <button @click="save">Save</button>
        <p class="status">{{ status }}</p>
      </section>
    </main>
  `,
};

createApp(App).mount('#app');
