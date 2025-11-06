/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ban, Edit, Shield, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../../../components/common/EmptyState";
import { Pagination } from "../../../components/common/Pagination";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Loading } from "../../../components/ui/Loading";
import { useGetAdminUsersQuery } from "../../../store/api/adminApi";

export const AdminUsers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data: usersData, isLoading } = useGetAdminUsersQuery({
    page: currentPage,
    page_size: 20,
    search: searchQuery || undefined,
    role: roleFilter || undefined,
  });

  const users = usersData?.items || [];
  const totalPages = usersData?.pages || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Users</h1>
          <p className="text-base-content/70 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button variant="primary" icon={<UserPlus className="w-5 h-5" />}>
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control flex-1">
              <input
                type="text"
                placeholder="Search users..."
                className="input input-bordered"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="form-control">
              <select
                className="select select-bordered"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="customer">Customer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {users.length > 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-12">
                            <span className="text-lg">
                              {user.first_name?.[0] || user.email?.[0] || "U"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm opacity-50">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role: any) => (
                          <Badge key={role.id} variant="primary" size="sm">
                            {role.name}
                          </Badge>
                        )) || (
                          <Badge variant="secondary" size="sm">
                            Customer
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={user.is_active ? "success" : "error"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      {new Date(
                        user.created_at || Date.now()
                      ).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Shield className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Ban className="w-4 h-4" />}
                          className="text-error"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Users className="w-20 h-20 text-base-content/30" />}
          title="No users found"
          description="No users match your current filters."
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
