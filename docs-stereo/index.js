
const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const MarkdownBlock = CompLibrary.MarkdownBlock;
const Container = CompLibrary.Container;

class HomeSplash extends React.Component {
  render() {
    const { siteConfig, language = '' } = this.props;
    const { baseUrl, docsUrl } = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    return (
      <div className="mw8 center tc mb5">

        <div className="cf mv5 f5">

          <div className="db fl w-25 tl pr4">
            <div className="b mb3 bb bw2 pa1 b">I</div>
            <a className="db underline ml1" href={docUrl('installation')}>Installation</a>
          </div>

          <div className="db fl w-25 tl pr4">
            <div className="mb3 bb bw2 pa1 b">II</div>
            <a className="db underline ml1" href={docUrl('routing')}>URL Routing</a>
            <a className="db underline ml1" href={docUrl('rendering')}>Rendering Content</a>
            <a className="db underline ml1" href={docUrl('templates')}>Templates</a>
            <a className="db underline ml1" href={docUrl('handlebarshelpers')}>Handlebars Helpers</a>
          </div>

          <div className="db fl w-25 tl pr4">
            <div className="mb3 bb bw2 pa1 b">III</div>
            <a className="db underline ml1" href={docUrl('requests')}>HTTP Requests</a>
            <a className="db underline ml1" href={docUrl('cookies')}>Cookies</a>
            <a className="db underline ml1" href={docUrl('data')}>Data</a>
          </div>

          <div className="db fl w-25 tl pr4">
            <div className="mb3 bb bw2 pa1 b">IV</div>
            <a className="db underline ml1" href={docUrl('misc')}>Misc Helpers</a>
            <a className="db underline ml1" href={docUrl('advanced')}>Advanced Usage</a>
          </div>
        </div>

      </div>

    );
  }
}

class Index extends React.Component {
  render() {
    const { config: siteConfig, language = '' } = this.props;
    const { baseUrl } = siteConfig;

    return (
      <div>
        <div className="mw8 mv5 f3 center">
          This tool kit was designed to make it easy to develop internet-based applications that operate in perpetuity with minimal technical overhead. Templates are dynamically rendered on the server and delivered as static html. This framework provides organization for your project and conventions for making technical decisions.<br /><br />
          This documentation is a perpetual work in progress, please pardon our dust &nbsp; : )
        </div>
        <HomeSplash siteConfig={siteConfig} language={language} />
      </div>
    );
  }
}

module.exports = Index;






