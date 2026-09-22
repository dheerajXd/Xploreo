

export default function Statcard({title,value,subtitle,icon,color}){
    return(
        <div className="stat-card">
            {icon && (
                <div className="stat-icon" style={{ color: color }}>
                    {icon}
                </div>
            )}
            <p className="stat-title">{title}</p>
            <h2 className="stat-value">{value}</h2>
            {subtitle && (
                <p className="stat-subtitle">{subtitle}</p>
            )}
        </div>
    )
}