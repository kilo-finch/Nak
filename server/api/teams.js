const router = require('express').Router()
const {Collection, Links, Team, User} = require('../db/models')
const op = require('sequelize').Op

let io
let socket
const setIO = (IO, SOCKET) => {
  io = IO
  socket = SOCKET
}

module.exports = {router, setIO}

router.get('/', async (req, res, next) => {
  if (req.user) {
    try {
      const allUserTeams = await Team.findAll({
        include: {
          model: User,
          where: {
            id: req.user.id
          }
        }
      })
      //connecting the user to each team room
      allUserTeams.forEach(team => {
        socket.join(team.id)
      })
      res.send(allUserTeams)
    } catch (error) {
      next(error)
    }
  } else {
    res.sendStatus(403)
  }
})

router.get('/:teamId', async (req, res, next) => {
  if (req.user) {
    try {
      const singleTeam = await Team.findByPk(+req.user.params.teamId)
      res.send(singleTeam)
    } catch (error) {
      next(error)
    }
  }
})

router.post('/', async (req, res, next) => {
  if (req.user) {
    try {
      const newTeam = await Team.create({name: req.body.name})
      let members = []
      if (req.body.members) {
        members = req.body.members.split(',')
      }
      members.push(req.user.email)
      const newMembers = await User.findAll({
        where: {email: {[op.in]: members}}
      })
      await newTeam.setUsers(newMembers)
      //FIX THIS
      socket.join(newTeam.id)
      io.emit('get_all_teams')
      console.log(io.sockets.adapter.rooms)

      res.send(newTeam)
    } catch (error) {
      next(error)
    }
  }
})

router.put('/:teamId', async (req, res, next) => {
  if (req.user) {
    try {
      const teamId = +req.body.teamId
      if (req.body.email) {
        const userToAdd = await User.findOne({where: {email: req.body.email}})
        const team = await Team.findByPk(teamId)
        await userToAdd.addTeam(team)
        io.to(teamId).emit('get_team', teamId)
        res.send(team)
      } else if (req.body.name) {
        const updatedTeam = await Team.update(
          {name: req.body.name},
          {where: {id: teamId}, returning: true, plain: true}
        )
        io.to(teamId).emit('get_team', teamId)
        res.send(updatedTeam[1])
      }
    } catch (error) {
      throw error
    }
  }
})

router.delete('/:teamId', async (req, res, next) => {
  if (req.user) {
    try {
      const teamId = +req.params.teamId
      let destroyedTeam = await Team.destroy({where: {id: teamId}})
      //test if this works
      io.to(teamId).emit('delete_team', teamId)
      io.sockets.clients(teamId).forEach(user => user.leave(teamId))
      res.sendStatus(204).send(destroyedTeam)
    } catch (error) {
      throw error
    }
  }
})
