interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white shadow-sm rounded-lg p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
