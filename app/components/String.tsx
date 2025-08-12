import React from 'react';

export type StringColor = 'yellow' | 'red' | 'black' | 'green' | 'purple' | 'gray';

interface StringProps {
  color?: 'yellow' | 'red' | 'black' | 'green' | 'purple' | 'gray';
  onClick?: () => void
}

const colorToClass = {
  yellow: 'bg-red-900',
  red: 'bg-blue-900',
  black: 'bg-green-900',
  green: 'bg-gray-900',
  purple: 'bg-purple-900',
  gray: 'bg-gray-900'
};

const String: React.FC<StringProps> = ({ color = 'gray', onClick = () => {} }) => {
  const bgClass = colorToClass[color] || 'bg-gray-900';

   const handleClick = () => {
    return onClick()
  }

  return (
    <div className="flex flex-col items-center cursor-pointer" onClick={handleClick}>
      <div className={`w-1 h-40 rounded-t ${bgClass}`}></div>
      <div className={`size-4 -mt-2 rounded-full ${bgClass}`}></div>
    </div>
  );
};

export default String;
