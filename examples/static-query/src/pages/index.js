import React from 'react';
import { Articles } from '../components/articles';
import Layout from '../components/layout';

const Home = props => {
  return (
    <Layout>
      <div>
        <h3>Hello</h3>
        <Articles />
      </div>
    </Layout>
  );
};

export default Home;
