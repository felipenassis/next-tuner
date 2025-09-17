import React, { useState, useEffect } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  hideValue?: boolean;
  className?: string;
}

const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  hideValue = false,
  unit = '',
  className = '',
}) => {
  const [sliderValue, setSliderValue] = useState(value);

  // Sincroniza o valor interno quando o valor prop muda
  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setSliderValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <span className={`${!hideValue || 'hidden'} text-sm font-semibold text-gray-700 dark:text-gray-300`}>
            {sliderValue.toFixed(step < 1 ? 2 : 0)}{unit}
          </span>
        </div>
      )}
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={handleChange}
        className={`
          w-full h-2 bg-disabled rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:hover:scale-125
          [&::-webkit-slider-thumb]:transition-transform
        `}
      />
      
      {!label && (
        <div className="text-right mt-1">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {sliderValue.toFixed(step < 1 ? 2 : 0)}{unit}
          </span>
        </div>
      )}
    </div>
  );
};

export default Slider;
