import React from 'react';
import { Link } from 'react-router-dom';

const Top: React.FC = () => {
    return (
        <div>
            <p>TOP</p>
            <Link to="/timeline">/timeline</Link>
        </div>
    );
};

export default Top;
