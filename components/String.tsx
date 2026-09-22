import React from 'react';

export type StringColor = 'yellow' | 'red' | 'black' | 'green' | 'purple' | 'gray';

interface StringProps {
  color?: StringColor;
  label?: string;
  onClick?: () => void
}

const colorToClass = {
  yellow: 'bg-yellow-900',
  red: 'bg-red-900',
  black: 'bg-black',
  green: 'bg-green-900',
  purple: 'bg-purple-900',
  gray: 'bg-gray-900'
};

const String: React.FC<StringProps> = ({ color = 'gray', label, onClick = () => {} }) => {
  const bgClass = colorToClass[color] || 'bg-gray-900';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ? `Tocar corda ${label}` : 'Tocar corda'}
      className="flex flex-col items-center cursor-pointer"
    >
      {/* Borda sempre visível: bg-black/bg-gray-900 sem contorno somem contra o fundo escuro do app. */}
      <div className={`w-1 h-40 rounded-t border border-border-strong ${bgClass}`}></div>
      <div className={`size-4 -mt-2 rounded-full border border-border-strong ${bgClass}`}></div>
    </button>
  );
};

export default String;
