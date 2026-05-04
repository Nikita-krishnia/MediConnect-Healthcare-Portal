import React from 'react';

const StatCard = ({ label, value, type }) => {
  return (
    <div className={`stat-card ${type || ''}`}>
      <h4>{label}</h4>
      <p className="stat-number">{value}</p>
    </div>
  );
};

export default StatCard;