import { getIsolatedQuery } from 'gatsby-source-graphql-universal';
import { isEmpty, pick } from 'lodash';
import Prismic from 'prismic-javascript';
import React from 'react';
import { fieldName, getCookies, typeName } from '../utils';
import { createLoadingScreen } from '../utils/createLoadingScreen';
import { getApolloClient } from '../utils/getApolloClient';
import { parseQueryString } from '../utils/parseQueryString';
import pathToRegexp from 'path-to-regexp';

const getParams = ({ pageContext = {}, location = {} }: any) => {
  const keys: any = [];
  const re = pathToRegexp(pageContext.matchPath || '', keys);
  const match = re.exec(location.pathname);
  if (match) {
    return keys.reduce((acc: any, value: any, index: number) => {
      acc[value.name] = match[index + 1];
      return acc;
    }, {});
  }
  return {};
};

const getUid = ({ pageContext = {}, location = {} }: any) => {
  if (!isEmpty(pageContext.uid)) {
    return pageContext.uid;
  }

  const qs = parseQueryString(String(location.search).substr(1));

  if (qs.has('uid')) {
    return qs.get('uid');
  }

  const params = getParams({ pageContext, location });

  if (params.uid) {
    return params.uid;
  }

  return null;
};

const getLang = ({ pageContext = {}, location = {} }: any) => {
  if (!isEmpty(pageContext.lang)) {
    return pageContext.lang;
  }

  const qs = parseQueryString(String(location.search).substr(1));

  if (qs.has('lang')) {
    return qs.get('lang');
  }

  return null;
};

interface WrapPageState {
  data: any;
  loading: boolean;
  error: Error | null;
}

export class WrapPage extends React.PureComponent<any, WrapPageState> {
  uid = getUid(this.props);
  lang = getLang(this.props);

  state: WrapPageState = {
    data: this.props.data,
    loading: false,
    error: null,
  };

  componentDidMount() {
    const { props, uid, lang } = this;
    const { pageContext, options } = props;
    const cookies = getCookies();
    const hasCookie = cookies.has(Prismic.experimentCookie) || cookies.has(Prismic.previewCookie);

    if (pageContext.rootQuery && options.previews !== false && hasCookie) {
      const closeLoading = createLoadingScreen();
      const keys = [...(options.passContextKeys || []), 'uid', 'lang'];
      const variables = pick({ ...pageContext, uid, lang }, keys);
      this.setState({ loading: true });
      this.load({ variables })
        .then(res => {
          this.setState({
            loading: false,
            error: null,
            data: { ...this.state.data, prismic: res.data },
          });
          closeLoading();
        })
        .catch(error => {
          this.setState({ loading: false, error });
        });
    }
  }

  load = ({ variables, query = this.props.pageContext.rootQuery }: any = {}) => {
    return getApolloClient(this.props.options).then(client => {
      return client.query({
        query: getIsolatedQuery(query, fieldName, typeName),
        fetchPolicy: 'network-only',
        variables,
      });
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
