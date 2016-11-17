import React from 'react'
import ReactDOM from 'react-dom'
import {
  Col,
  Grid,
  Panel,
  Row,
  Table
 } from 'react-bootstrap'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import style from './style.scss'
import _ from 'lodash'
import classnames from 'classnames'


const toPercent = (decimal, fixed = 0) => {
	return `${(decimal * 100).toFixed(fixed)}%`;
};

const color = {
  facebook: '#8884d8',
  slack: '#de5454',
  kik: '#ffc658',
  male: '#8884d8',
  female: '#de5454',
  conversation: '#de5454',
  retention: '0, 177, 92', //rgb, convert in rgba in code
  busyHours: '255, 162, 22' //rgb, convert in rgba in code
}

const renderLine = (data) => {
  return _.mapValues(data, (value, key) => {
    if(key !== 'name'){
      return <Line key={key} type="monotone" dataKey={key} stroke={color[key]} activeDot={{r: 8}}/>
    }
  })
}

const renderArea = (data) => {
  return _.mapValues(data, (value, key) => {
    if(key !== 'name'){
      return <Area key={key} type='monotone' dataKey={key} stackId="1" stroke={color[key]} fill={color[key]} />
    }
  })
}

class StatsHeader extends React.Component {

  constructor(props) {
    super(props)

    this.state = {}
  }

  componentDidMount() {
    this.metadataTimer = setInterval(this.fetchMetadata.bind(this), 10000)
    this.fetchMetadata()
  }

  componentWillUnmount() {
    this.unmounting = true
    clearInterval(this.metadataTimer)
  }

  fetchMetadata() {
    this.props.axios.get('/api/botpress-analytics/metadata')
    .then(({ data }) => {
      this.setState({ ...data })
    })
  }

  render() {
    if (!this.state.size) return null
    const size = this.state.size.toFixed(2)
    const className = classnames('pull-right', style.metadata)

    return <Row>
      <Col sm={12}>
        <div className={className}>
          {'Last updated: ' + this.state.lastUpdated}
          {' | ' + 'DB Size: ' + size + 'mb'}
        </div>
      </Col>
    </Row>
  }

}

export default class AnalyticsModule extends React.Component {

  constructor(props) {
    super(props)
    this.state = { loading: true }
  }

  componentDidMount() {
    this.unmounting = false
    
    this.props.bp.axios.get('/api/botpress-analytics/graphs')
    .then(({ data }) => {
      if (this.unmounting) return
      this.setState({ ...data })
    })

    this.props.bp.events.on('data.send', (data) => {
      if (this.unmounting) return
      this.setState({
          ...data
        }
      )
    })
  }

  renderErrorMessage() {
    return <p className={style.errorMessage}>
      {this.state.error}
    </p>
  }

  renderActiveUsersSimpleLineChart() {
    const data = this.state.activeUsersChartData.map(o => _.omit(o, 'total'))
    const sortedByKeys = _.sortBy(data, o => _.keys(o).length)
    const legend = sortedByKeys[sortedByKeys.length - 1]

    const SimpleLineChart = React.createClass({
    	render () {
      	return (
          <ResponsiveContainer>
          	<LineChart data={data}
                  margin={{top: 5, right: 30, left: 20, bottom: 5}}>
             <XAxis dataKey="name"/>
             <YAxis/>
             <CartesianGrid strokeDasharray="3 3"/>
             <Tooltip/>
             <Legend />
             {_.values(renderLine(legend))}
            </LineChart>
          </ResponsiveContainer>
        );
      }
    })
    return <SimpleLineChart />
  }

  renderStackedLineChartForTotalUsers() {
    const data = this.state.totalUsersChartData.map(o => _.omit(o, 'total'))
    const sortedByKeys = _.sortBy(data, o => _.keys(o).length)
    const legend = sortedByKeys[sortedByKeys.length - 1]

    const StackedAreaChart = React.createClass( {
      render () {
        return (
          <ResponsiveContainer >
            <AreaChart data={data}
                  margin={{top: 20, right: 50, left: 0, bottom: 0}}>
              <XAxis dataKey="name"/>
              <YAxis/>
              <CartesianGrid strokeDasharray="3 3"/>
              <Tooltip/>
              <Legend />
              {_.values(renderArea(data[0]))}
            </AreaChart>
          </ResponsiveContainer>
        );
      }
    })
    return <StackedAreaChart />
  }

  renderGenderPercentAreaChart() {
    const data = this.state.genderUsageChartData.map(o => _.omit(o, 'total'))
    const sortedByKeys = _.sortBy(data, o => _.keys(o).length)
    const legend = sortedByKeys[sortedByKeys.length - 1]

    const StackedAreaChart = React.createClass({
    	render () {
      	return (
          <ResponsiveContainer>
          	<AreaChart data={data} stackOffset="expand"
                  margin={{top: 10, right: 30, left: 0, bottom: 0}} >
              <XAxis dataKey="name"/>
              <YAxis tickFormatter={toPercent}/>
              <CartesianGrid strokeDasharray="3 3"/>
              <Tooltip />
              <Legend />
              {_.values(renderArea(legend))}
            </AreaChart>
          </ResponsiveContainer>
        );
      }
    })
    return <StackedAreaChart />
  }

  renderTypicalConversationLengthInADayChart() {
    const data = this.state.typicalConversationLengthInADay

    const SimpleBarChart = React.createClass({
    	render () {
      	return (
          <ResponsiveContainer>
            <BarChart data={data}
              margin={{top: 5, right: 30, left: 20, bottom: 5}}>
              <XAxis dataKey="name"/>
              <YAxis/>
              <CartesianGrid strokeDasharray="3 3"/>
              <Tooltip />
              <Bar dataKey="count" fill={color['conversation']} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    })
    return <SimpleBarChart />
  }

  renderSpecificMetricForLastDaysValues() {
    const data = this.state.specificMetricsForLastDays
    const nbOfInteractions = (data.numberOfInteractionInAverage || 0).toFixed(2)
    return (
      <div className={style.specificMetrics}>
        <h4>Average number of interactions</h4>
        <h1>{nbOfInteractions}</h1>

        <h4>Number of active users</h4>
        <h3><small>Today :</small> {data.numberOfUsersToday}</h3>
        <h5><small>Yesterday :</small> {data.numberOfUsersYesterday}</h5>
        <h5><small>Week :</small> {data.numberOfUsersThisWeek}</h5>
      </div>
    )
  }

  renderDays(){
    const days = [1,2,3,4,5,6,7]
    return days.map((i) => {
      return <td key={i}>Day {i}</td>
    })
  }

  renderRetentionHeatMapHeader(){
    return (
      <thead>
        <tr>
          <th>Date</th>
          <td>Users</td>
          {this.renderDays()}
          <td>Overall</td>
        </tr>
      </thead>
    )
  }

  renderRetentionData(value, i){
    if(value === null) {
      return <td key={i}>&nbsp;</td>
    }

    if(i === 0){
      return <td key={i}>{value}</td>
    }

    const opacity = value * value
    const bgStyle = {
      'backgroundColor': 'rgba(' + color['retention'] + ',' + opacity + ')'
     }
    return <td style={bgStyle} key={i}>{toPercent(value)}</td>
  }

  renderRetentionRow(rowValues, key){
    const date = key
    const rowData = rowValues.map(this.renderRetentionData.bind(this))
    return (
      <tr key={date}>
        <th>{date}</th>
        {rowData}
      </tr>
    )
  }

  renderRetentionHeatMapBody() {
    const dataPerDate = _.mapValues(this.state.retentionHeatMap, this.renderRetentionRow.bind(this))
    return (
      <tbody key='retention'>
        {_.values(dataPerDate)}
      </tbody>
    )
  }

  renderRetentionHeatMapChart() {
    return (
      <Table striped bordered hover className={style.rententionHeatMap}>
        {this.renderRetentionHeatMapHeader()}
        {this.renderRetentionHeatMapBody()}
      </Table>
    )
  }

  renderHours(){
    const hours = []
    for (var i = 0; i < 24; i++) {
      hours.push(i)
    }

    return hours.map((i) => {
      return <td key={i}>{i}</td>
    })
  }

  renderBusyHoursHeatMapHeader() {
    return (
      <thead>
        <tr>
          <th>Hours</th>
          {this.renderHours()}
        </tr>
      </thead>
    )
  }

  renderBusyHoursData(value, i) {
    const opacity = value
    const bgStyle = {
      'backgroundColor': 'rgba(' + color['busyHours'] + ',' + opacity + ')'
     }
    return <td style={bgStyle} key={i}>&nbsp;</td>
  }

  renderBusyHoursRow(rowValues, key) {
    const date = key
    const rowData = rowValues.map(this.renderBusyHoursData.bind(this))
    return (
      <tr key={date}>
        <th>{date}</th>
          {rowData}
      </tr>
    )
  }

  renderBusyHoursHeatMapBody() {
    const dataPerDate = _.mapValues(this.state.busyHoursHeatMap, this.renderBusyHoursRow.bind(this))
    return (
      <tbody key='busyhours'>
        {_.values(dataPerDate)}
      </tbody>
    )
  }

  renderBusyHoursHeatMapChart() {
    return (
      <div className={style.busyHoursHeatMap}>
        <Table>
          {this.renderBusyHoursHeatMapHeader()}
          {this.renderBusyHoursHeatMapBody()}
        </Table>
      </div>
    )
  }

  renderTotalNumberOfUsersPanel() {
    return(
      <Panel header='Total number of users'>
        <div className={style.graphContainer}>
          {this.renderStackedLineChartForTotalUsers()}
        </div>
      </Panel>
    )
  }

  renderActiveUsersPanel() {
    return(
      <Panel header='Active users in last 2 weeks'>
        <div className={style.graphContainerTwoColumn}>
          {this.renderActiveUsersSimpleLineChart()}
        </div>
      </Panel>
    )
  }

  renderGenderUsagePanel() {
    return(
      <Panel header='Gender usage in last week'>
        <div className={style.graphContainerTwoColumn}>
          {this.renderGenderPercentAreaChart()}
        </div>
      </Panel>
    )
  }

  renderSpecificMetricForLastDaysPanel() {
      return(
        <Panel header='Insights'>
          <div className={style.graphContainerTwoColumn}>
            {this.renderSpecificMetricForLastDaysValues()}
          </div>
        </Panel>
      )
  }

  renderTypicalConversationInADayPanel() {
    return(
      <Panel header='Average incoming interactions (last 2 weeks)'>
        <div className={style.graphContainerTwoColumn}>
          {this.renderTypicalConversationLengthInADayChart()}
        </div>
      </Panel>
    )
  }

  renderRetentionHeatMapPanel() {
    return (
      <Panel header='Rentention for last 7 days'>
        <div className={style.graphContainer}>
          {this.renderRetentionHeatMapChart()}
        </div>
      </Panel>
    )
  }

  renderBusyHoursHeatMapPanel() {
    return (
      <Panel header='Busy hours for last 7 days'>
        <div className={style.graphContainer}>
          {this.renderBusyHoursHeatMapChart()}
        </div>
      </Panel>
    )
  }


  renderBasicMetrics() {
    return (
      <Grid fluid >
        <Row>
          <Col md={12}>
            {this.renderTotalNumberOfUsersPanel()}
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            {this.renderActiveUsersPanel()}
          </Col>
          <Col md={6}>
            {this.renderGenderUsagePanel()}
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            {this.renderSpecificMetricForLastDaysPanel()}
          </Col>
          <Col md={8}>
            {this.renderTypicalConversationInADayPanel()}
          </Col>
        </Row>
      </Grid>
    )
  }

  renderAdvancedMetrics() {
    return (
      <Grid fluid >
        <Row>
          <Col md={12}>
            {this.renderRetentionHeatMapPanel()}
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            {this.renderBusyHoursHeatMapPanel()}
          </Col>
        </Row>
      </Grid>
    )
  }

  renderAllMetrics() {
    return (
      <div>
        <StatsHeader axios={this.props.bp.axios}/>
        {this.renderBasicMetrics()}
        {this.renderAdvancedMetrics()}
      </div>
    )
  }

  renderNoAnalyticsYet() {
    return <Grid fluid >
      <Row>
        <Col md={12}>
          <Panel header='Generating analytics data'>
            <div>
              There are no analytics available yet. 
              Generating analytics can take up to 5 minutes after receiving a message.
            </div>
          </Panel>
        </Col>
      </Row>
    </Grid>
  }

  render() {
    if(this.state.noData || !this.state.totalUsersChartData) {
      return this.renderNoAnalyticsYet()
    }

    return <div>
      {this.state.loading ? <h3>Wait, we are loading graphs...</h3> : this.renderAllMetrics()}
    </div>
  }
}
