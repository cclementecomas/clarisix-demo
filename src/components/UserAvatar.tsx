import { Facehash } from 'facehash';

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({ name, size = 32, className = '' }: UserAvatarProps) {
  return (
    <div className={className}>
      <Facehash
        name={name}
        size={size}
        round={true}
        colors={['#0ea5e9', '#0284c7', '#f59e0b']}
      />
    </div>
  );
}
