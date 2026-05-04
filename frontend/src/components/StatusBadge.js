import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      default: return '';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;