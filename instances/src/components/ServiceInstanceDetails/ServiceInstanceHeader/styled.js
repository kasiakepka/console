import styled from 'styled-components';

export const ToolbarWrapper = styled.section`
  background-color: #fff;
`;

export const BreadcrumbWrapper = styled.div`
   {
    display: flex;
    justify-content: space-between;
    max-height: 1.25em;
    & > * {
      margin: 32px;
    }
  }
`;