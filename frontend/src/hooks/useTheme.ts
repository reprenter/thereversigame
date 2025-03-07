
export const useTheme = () => {
  const toggleTheme = () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.classList.toggle('light');
      rootElement.classList.toggle('dark');
    }
  };

  return {
    toggleTheme
  };
}