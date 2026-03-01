import { create } from 'zustand';

const useThemeStore = create((set) => ({
    dark: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
    toggle: () => set((state) => {
        const newDark = !state.dark;
        localStorage.setItem('theme', newDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', newDark);
        return { dark: newDark };
    }),
    init: () => {
        const isDark = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
        set({ dark: isDark });
    },
}));

export default useThemeStore;
