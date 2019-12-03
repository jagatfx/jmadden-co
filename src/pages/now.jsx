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

const Now = center => (
  <Layout>
    <Helmet title={'Jacob Madden | Now'} />
    <Header title="Now"></Header>
    <Container center={center}>
      <p>&quot;Embracing the now for it is all we have&quot;</p>

      <h2>Date Updated</h2>

      <p>12/02/2019</p>

      <h2>Location</h2>

      <p>Schenectady, New York, USA</p>

      <h2>What I&#39;m Doing Right Now</h2>

      <p>Working on a Costa Rica jungle VR experience where you experience life as different animals</p>
      <p>Editing footage from our Azure Kinect real-time volumetric capture augmented reality dancer performances</p>
      <p>Exploring virtual hand interactions on Oculus Quest</p>
      <p>Investigating health and wellness wearables and metrics</p>
      <p>Making a trail challenge app</p>
    </Container>
  </Layout>
);

export default Now;

Container.propTypes = {
  center: PropTypes.object,
};
