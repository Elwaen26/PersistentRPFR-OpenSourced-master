export default [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: 'cil-speedometer',
    actions: ['Announcement', 'Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Server Logs',
    to: '/logs/server',
    icon: 'cilNotes',
    actions: ['ReadServerLogs', 'Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Panel Logs',
    to: '/logs/panel',
    icon: 'cilNotes',
    actions: ['ReadPanelLogs', 'Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'User Management',
    to: '/users',
    icon: 'cilPeople',
    actions: ['Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Role Management',
    to: '/roles',
    icon: 'cilHttps',
    actions: ['Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Players',
    to: '/players/list',
    icon: 'cilWheelchair',
    actions: ['ViewPlayers', 'Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Ban List',
    to: '/players/banlist',
    icon: 'cilXCircle',
    actions: ['BanPlayers', 'Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Refund Calculator',
    to: '/compensatecalculator',
    icon: 'cilMoney',
    actions: ['CompansateCalculator', 'Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Server Management',
    to: '/server',
    icon: 'cilLayers',
    actions: ['Announcement', 'Administrator'],
  },
  {
    component: 'CNavItem',
    name: 'Logout',
    to: '/logout',
    icon: 'cilMoodBad',
  },
  // {
  //   component: 'CNavItem',
  //   name: 'Widgets',
  //   to: '/widgets',
  //   icon: 'cil-calculator',
  //   badge: {
  //     color: 'primary',
  //     text: 'NEW',
  //     shape: 'pill',
  //   },
  // },
  // {
  //   component: 'CNavGroup',
  //   name: 'Pages',
  //   to: '/pages',
  //   icon: 'cil-star',
  //   items: [
  //     {
  //       component: 'CNavItem',
  //       name: 'Login',
  //       to: '/pages/login',
  //     },
  //     {
  //       component: 'CNavItem',
  //       name: 'Register',
  //       to: '/pages/register',
  //     },
  //     {
  //       component: 'CNavItem',
  //       name: 'Error 404',
  //       to: '/pages/404',
  //     },
  //     {
  //       component: 'CNavItem',
  //       name: 'Error 500',
  //       to: '/pages/500',
  //     },
  //   ],
  // },

  // {
  //   component: 'CNavItem',
  //   name: 'Download CoreUI',
  //   href: 'http://coreui.io/vue/',
  //   icon: { name: 'cil-cloud-download', class: 'text-white' },
  //   _class: 'bg-success text-white',
  //   target: '_blank'
  // },
  // {
  //   component: 'CNavItem',
  //   name: 'Try CoreUI PRO',
  //   href: 'http://coreui.io/pro/vue/',
  //   icon: { name: 'cil-layers', class: 'text-white' },
  //   _class: 'bg-danger text-white',
  //   target: '_blank'
  // }
]
