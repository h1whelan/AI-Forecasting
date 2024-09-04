import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const GroupAssignment = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (groupId === 'A' || groupId === 'B' || groupId === 'C') {
      localStorage.setItem('groupId', groupId);
      navigate('/', { replace: true });
    } else {
      navigate('/');
    }
  }, [groupId, navigate]);

  return null;
};

export default GroupAssignment;