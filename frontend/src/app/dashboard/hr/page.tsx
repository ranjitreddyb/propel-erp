'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hrApi } from '@/services/api';
import { KpiCard, Grid, Card, PageHeader, Button, Badge, Loading, EmptyState } from '@/components/ui';
import { Plus, Search, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

type Employee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name?: string;
  department: string;
  designation: string;
  email: string;
  status: string;
  employment_type: string;
  join_date: string;
  basic_salary: number;
};

export default function HRPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => hrApi.getEmployees({ pageSize: 50 }),
  });

  const employeeList: Employee[] = employees?.data || DEMO_EMP;

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(employeeList.map((e) => e.department));
    return Array.from(depts);
  }, [employeeList]);

  // Filter employees based on search and department
  const filteredEmployees = useMemo(() => {
    return employeeList.filter((e) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        e.first_name.toLowerCase().includes(searchLower) ||
        (e.last_name && e.last_name.toLowerCase().includes(searchLower)) ||
        e.employee_code.toLowerCase().includes(searchLower) ||
        e.department.toLowerCase().includes(searchLower) ||
        e.designation.toLowerCase().includes(searchLower) ||
        e.email.toLowerCase().includes(searchLower);
      
      const matchesDepartment = departmentFilter === 'all' || e.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  }, [employeeList, searchQuery, departmentFilter]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Human Resource Management"
        subtitle="Employee lifecycle, payroll, attendance & compliance"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast('Exporting employee data…')}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast('Opening employee form…')}>
              <Plus size={14} /> Add Employee
            </Button>
          </div>
        }
      />

      <Grid cols={4} className="mb-5">
        <KpiCard icon="👥" value={String(employeeList.length)} label="Total Employees" change="↑ 3 this month" changeUp color="accent" />
        <KpiCard icon="✅" value={String(employeeList.filter((e) => e.status === 'active').length)} label="Present Today" color="green" />
        <KpiCard icon="💰" value="₹48.2L" label="Monthly Payroll" color="yellow" />
        <KpiCard icon="📋" value="8" label="Open Positions" color="purple" />
      </Grid>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[280px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Search by name, ID, department, designation, email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
            data-testid="hr-search-input"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="form-input w-auto min-w-[180px]"
          data-testid="hr-department-filter"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => toast('More filters coming soon…')}>
          <Filter size={14} /> More Filters
        </Button>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
          Showing <strong>{filteredEmployees.length}</strong> of {employeeList.length} employees
          {searchQuery && <> matching "<em>{searchQuery}</em>"</>}
        </p>
      )}

      <Card>
        {isLoading ? (
          <Loading />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No employees found"
            message={searchQuery ? `No results for "${searchQuery}"` : 'No employees in this department'}
            action={
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setDepartmentFilter('all'); }}>
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Type</th>
                  <th>Join Date</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e: Employee) => (
                  <tr
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => toast(`Opening ${e.first_name}'s profile…`)}
                    data-testid={`employee-row-${e.id}`}
                  >
                    <td className="font-mono text-xs" style={{ color: 'var(--text3)' }}>{e.employee_code}</td>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>
                      {e.first_name} {e.last_name || ''}
                    </td>
                    <td>{e.department}</td>
                    <td>{e.designation}</td>
                    <td>
                      <Badge variant={e.employment_type === 'full_time' ? 'active' : 'blue'}>
                        {e.employment_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td>{e.join_date}</td>
                    <td>₹{Number(e.basic_salary).toLocaleString('en-IN')}</td>
                    <td>
                      <Badge variant={e.status === 'active' ? 'active' : 'expired'}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
const DEMO_EMP: Employee[] = [
  { id: '1', employee_code: 'EMP-0001', first_name: 'Arjun', last_name: 'Sharma', department: 'Property Management', designation: 'Senior Manager', email: 'arjun@wisewit.ai', status: 'active', employment_type: 'full_time', join_date: '15 Jun 2018', basic_salary: 120000 },
  { id: '2', employee_code: 'EMP-0002', first_name: 'Priya', last_name: 'Reddy', department: 'Finance', designation: 'Finance Head', email: 'priya@wisewit.ai', status: 'active', employment_type: 'full_time', join_date: '01 Mar 2019', basic_salary: 150000 },
  { id: '3', employee_code: 'EMP-0003', first_name: 'Kiran', last_name: 'Patel', department: 'Facility Management', designation: 'Operations Lead', email: 'kiran@wisewit.ai', status: 'active', employment_type: 'full_time', join_date: '10 Sep 2020', basic_salary: 95000 },
  { id: '4', employee_code: 'EMP-0004', first_name: 'Sneha', last_name: 'Gupta', department: 'HR', designation: 'HR Manager', email: 'sneha@wisewit.ai', status: 'active', employment_type: 'full_time', join_date: '05 Jan 2021', basic_salary: 85000 },
  { id: '5', employee_code: 'EMP-0005', first_name: 'Rahul', last_name: 'Kumar', department: 'IT', designation: 'Tech Lead', email: 'rahul@wisewit.ai', status: 'active', employment_type: 'full_time', join_date: '12 Apr 2022', basic_salary: 110000 },
];
