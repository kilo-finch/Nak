import React, {Component} from 'react'
import {LinkCard, LinkForm} from './index'
import {connect} from 'react-redux'

export default class Collection extends Component {
  render() {
    const {links} = this.props
    return (
      <div style={{border: '2px black solid'}}>
        <div>
          {links ? (
            links.map(link => <LinkCard props={link} key={link.id} />)
          ) : (
            <h3>
              You have no links saved in your collection! Add a link to get
              started.
            </h3>
          )}
        </div>
        <LinkForm />
      </div>
    )
  }
}

const mapState = state => {
  return {
    links: state.links
  }
}

const mapProps = dispatch => ({})
