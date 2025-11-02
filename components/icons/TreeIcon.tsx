
import React from 'react';

const TreeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  const { className, style, ...rest } = props;
  return (
    <img 
      src="/static/interactive_tree.png" 
      alt="Tree Icon"
      className={className}
      style={{ display: 'inline-block', transform: 'scale(1.6)', ...style }}
      {...rest}
    />
  );
};

export default TreeIcon;
