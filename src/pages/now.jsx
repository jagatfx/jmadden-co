import React from 'react';
import Helmet from 'react-helmet';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { Header } from 'components';
import { Layout, Container } from 'layouts';

const Text = styled.div`
    margin: 2rem 10rem;
  }
`;

const ImageWrap = styled.img`
  padding-top: 10px;
`;

const Now = (center) => (
  <Layout>
    <Helmet title={'Jacob Madden | Now'} />
    <Header title="Now"></Header>
    <Container center={center}>
      <p>&quot;Embracing the now for it is all we have&quot;</p>

      <h2>Date Updated</h2>

      <p>02/24/2020</p>

      <h2>Location</h2>

      <p>New York, NY, USA</p>

      <h2>What I&#39;m Doing Right Now</h2>

      <p>Onboarding at a new gig and learning all the things</p>
      <p>
        Experimenting with features for practicar spanish language practice
        React app
      </p>
      <p>Exploring character cartridges and personas in virtual reality</p>
      <p>Finalizing trail challenge React-based mobile app</p>
    </Container>
  </Layout>
);

export default Now;

Container.propTypes = {
  center: PropTypes.object,
};
