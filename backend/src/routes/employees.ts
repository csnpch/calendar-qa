import { Elysia, t } from 'elysia';
import { EmployeeService } from '../services/employeeService';
import Logger from '../utils/logger';

const employeeService = new EmployeeService();

export const employeesRoutes = new Elysia({ prefix: '/employees' })
  .get('/', () => employeeService.getAllEmployees())
  
  .get('/:id', ({ params: { id } }) => {
    const employee = employeeService.getEmployeeById(Number(id));
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  .post('/', ({ body }) => {
    try {
      Logger.debug(`Creating new employee: ${JSON.stringify(body)}`);
      const newEmployee = employeeService.createEmployee(body);
      Logger.info(`Created employee: ${newEmployee.name} (ID: ${newEmployee.id})`);
      return newEmployee;
    } catch (error) {
      Logger.error('Error creating employee:', error);
      Logger.error('Employee data:', JSON.stringify(body, null, 2));
      throw error;
    }
  }, {
    body: t.Object({
      name: t.String()
    })
  })
  
  .put('/:id', ({ params: { id }, body }) => {
    const employee = employeeService.updateEmployee(Number(id), body);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.Optional(t.String())
    })
  })
  
  .delete('/:id', ({ params: { id } }) => {
    const success = employeeService.deleteEmployee(Number(id));
    if (!success) {
      throw new Error('Employee not found');
    }
    return { success: true };
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  .get('/search/:query', ({ params: { query } }) => {
    return employeeService.searchEmployees(query);
  }, {
    params: t.Object({
      query: t.String()
    })
  })
  
  .get('/stats/overview', () => {
    return employeeService.getEmployeeStats();
  });