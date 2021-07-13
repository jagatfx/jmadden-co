import React from 'react';
import Helmet from 'react-helmet';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { Header } from 'components';
import { Layout, Container } from 'layouts';
import logo from '../../static/logo/logo.png';

const Text = styled.div`
    margin: 2rem 10rem;
  }
`;

const ImageWrap = styled.img`
  padding-top: 10px;
`;

const About = (center) => (
  <Layout>
    <Helmet title={'Jacob Madden | About'} />
    <Header title="About"></Header>
    <Container center={center}>
      <div>
        <h3>Jacob Madden</h3>
        <br />
        Experienced Lead Developer with a demonstrated history of working in the
        computer software industry. Strong consulting professional skilled in
        full-stack software development, artificial intelligence, robotics,
        VR/AR and data analytics.
      </div>
      <ImageWrap src={logo} alt="logo" />
      <div>
        Georgia Tech grad, full stack software developer, artificial
        intelligence & machine learning researcher, VR/AR/MR, robotics, Unity,
        iOS
      </div>
    </Container>
  </Layout>
);

export default About;

Container.propTypes = {
  center: PropTypes.object,
};
