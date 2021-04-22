import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/header';

const Top: React.FC = () => {
    console.log('top render');
    return (
        <div>
            <Header />
        </div>
    );
};

export default Top;
