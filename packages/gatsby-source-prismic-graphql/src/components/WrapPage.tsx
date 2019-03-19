import { getIsolatedQuery } from 'gatsby-source-graphql-universal';
import { isEmpty } from 'lodash';
import React from 'react';
import { getApolloClient } from '../utils/getApolloClient';
import { parseQueryString } from '../utils/parseQueryString';
import { createLoadingScreen } from '../utils/createLoadingScreen';

const getUid = ({ pageContext = {}, location = {} }: any) => {
  if (!isEmpty(pageContext.uid)) {
    return pageContext.uid;
  }

  const qs = parseQueryString(String(location.search).substr(1));

  if (qs.has('uid')) {
    return qs.get('uid');
  }

  return String(location.pathname).substr(String(pageContext.matchPath).length - 1);
};

interface WrapPageState {
  data: any;
  loading: boolean;
  error: Error | null;
}

export class WrapPage extends React.PureComponent<any, WrapPageState> {
  uid = getUid(this.props);

  client = getApolloClient(this.props.options);

  state: WrapPageState = {
    data: this.props.data,
    loading: false,
    error: null,
  };

  componentDidMount() {
    const { props, uid } = this;

    if (props.pageContext.rootQuery && props.options.previews !== false) {
      const closeLoading = createLoadingScreen();
      this.load({ uid }).then(closeLoading);
    }
  }

  load = (variables: any, query = this.props.pageContext.rootQuery) => {
    this.setState({ loading: true });

    return this.client
      .query({
        query: getIsolatedQuery(query, 'prismic', 'PRISMIC'),
        fetchPolicy: 'network-only',
        variables,
      })
      .then(res => {
        this.setState({
          loading: false,
          error: null,
          data: { ...this.state.data, prismic: res.data },
        });
      })
      .catch(error => {
        this.setState({ loading: false, error });
      });
  };

  render() {
    const children = this.props.children as any;

    return React.cloneElement(children, {
      ...children.props,
      prismic: {
        options: this.props.options,
        loading: this.state.loading,
        error: this.state.error,
        load: this.load,
      },
      data: this.state.data,
    });
  }
}
