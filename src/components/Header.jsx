import React from 'react';
import styled from '@emotion/styled';
import Img from 'gatsby-image';
import PropTypes from 'prop-types';

import githubLogo from './github.png';
import linkedinLogo from './linkedin.png';

const Wrapper = styled.header`
  -webkit-clip-path: polygon(100% 0, 0 0, 0 70%, 50% 100%, 100% 70%);
  clip-path: polygon(100% 0, 0 0, 0 70%, 50% 100%, 100% 70%);
  @media (max-width: ${(props) => props.theme.breakpoints.s}) {
    -webkit-clip-path: polygon(100% 0, 0 0, 0 90%, 50% 100%, 100% 90%);
    clip-path: polygon(100% 0, 0 0, 0 90%, 50% 100%, 100% 90%);
  }
  background: ${(props) => props.theme.gradient.rightToLeft};
  height: 300px;
  @media (max-width: ${(props) => props.theme.breakpoints.m}) {
    height: 300px;
  }
  @media (max-width: ${(props) => props.theme.breakpoints.s}) {
    height: 275px;
  }
  position: relative;
  overflow: hidden;
`;

const Link = styled.a`
  padding: 5px;
`;

const Quote = styled.blockquote`
  font-style: italic;
`;

const SubHeader = styled.div`
  padding-top: 20px;
  text-align: center;
`;

const Text = styled.div`
  color: ${(props) => props.theme.colors.white.base};
  z-index: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
  max-width: ${(props) => props.theme.layout.base};
  padding: 0 2rem;
  margin-bottom: 3rem;
  align-items: center;
`;

const Subtitle = styled.p`
  max-width: 650px;
  color: ${(props) => props.theme.colors.white.light};
`;

const Header = ({ children, title, date, cover }) => (
  <div>
    <Wrapper>
      <Text>
        <h1>{title}</h1>
        <h3>{date}</h3>

        {children && <Subtitle>{children}</Subtitle>}
      </Text>
    </Wrapper>
    <SubHeader>
      <Quote>
        Don't cry because it's over, smile because it happened. -Dr Seuss
      </Quote>
      <span>
        <Link href="https://github.com/jagatfx" target="_blank">
          <img src={githubLogo} alt="Github" />
        </Link>
        <Link href="https://www.linkedin.com/in/jacobmadden/" target="_blank">
          <img src={linkedinLogo} alt="LinkedIn" />
        </Link>
      </span>
    </SubHeader>
  </div>
);

export default Header;

Header.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.bool]),
  cover: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.bool,
  ]),
};

Header.defaultProps = {
  children: false,
  cover: false,
  date: false,
  title: false,
};
