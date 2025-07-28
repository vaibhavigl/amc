import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  Building,
  User,
  AlertTriangle,
  Grid3X3,
  List
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

interface Contract {
  id: string;
  amcType: string;
  make: string;
  model: string;
  serialNumber: string;
  assetNumber: string;
  warrantyStart: string;
  warrantyEnd: string;
  amcStart: string;
  amcEnd: string;
  location: string;
  vendor: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

const ContractList: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/contracts');
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        await axios.delete(`http://localhost:3001/api/contracts/${id}`);
        setContracts(contracts.filter(contract => contract.id !== id));
      } catch (error) {
        console.error('Error deleting contract:', error);
        alert('Failed to delete contract');
      }
    }
  };

  const isExpiringSoon = (amcEnd: string) => {
    const endDate = new Date(amcEnd);
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return endDate <= nextMonth && endDate >= today;
  };

  const isExpired = (amcEnd: string) => {
    const endDate = new Date(amcEnd);
    const today = new Date();
    return endDate < today;
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'expiring') return matchesSearch && isExpiringSoon(contract.amcEnd);
    if (filterType === 'expired') return matchesSearch && isExpired(contract.amcEnd);
    if (filterType === 'active') return matchesSearch && !isExpired(contract.amcEnd);
    if (filterType === 'comprehensive') return matchesSearch && contract.amcType === 'Comprehensive';
    if (filterType === 'non-comprehensive') return matchesSearch && contract.amcType === 'Non-comprehensive';
    
    return matchesSearch;
  });

  const renderStatusBadge = (contract: Contract) => {
    if (isExpired(contract.amcEnd)) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Expired
        </span>
      );
    }
    if (isExpiringSoon(contract.amcEnd)) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          Expiring Soon
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
        Active
      </span>
    );
  };

  const renderTypeBadge = (amcType: string) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      amcType === 'Comprehensive' 
        ? 'bg-blue-100 text-blue-800' 
        : 'bg-green-100 text-green-800'
    }`}>
      {amcType}
    </span>
  );
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AMC Contracts</h1>
          <p className="text-gray-600 mt-2">
            Manage your Annual Maintenance Contracts
          </p>
        </div>
        <Link
          to="/contracts/new"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contract</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Contracts</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="comprehensive">Comprehensive</option>
                <option value="non-comprehensive">Non-comprehensive</option>
              </select>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'card'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Table</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {filteredContracts.length} of {contracts.length} contracts
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Display */}
      {filteredContracts.length === 0 ? (
        <div className="text-center py-12">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first AMC contract'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <Link
              to="/contracts/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Contract</span>
            </Link>
          )}
        </div>
      ) : viewMode === 'card' ? (
        {/* Card View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.assetNumber}
                    </h3>
                    <p className="text-gray-600">{contract.make} {contract.model}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderStatusBadge(contract)}
                    {renderTypeBadge(contract.amcType)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>AMC: {new Date(contract.amcStart).toLocaleDateString()} - {new Date(contract.amcEnd).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building className="w-4 h-4" />
                    <span className="truncate">{contract.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="truncate">{contract.vendor}</span>
                  </div>
                  {user?.role === 'MANAGER' && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="truncate">Owner: {contract.owner.name}</span>
                    </div>
                  )}
                </div>

                {isExpiringSoon(contract.amcEnd) && !isExpired(contract.amcEnd) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <p className="text-yellow-800 text-sm font-medium">
                        Expires in {Math.ceil((new Date(contract.amcEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Created {new Date(contract.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/contracts/${contract.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        {/* Table View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AMC Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {user?.role === 'MANAGER' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contract.assetNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contract.make} {contract.model}
                        </div>
                        <div className="text-xs text-gray-400">
                          S/N: {contract.serialNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(contract.amcStart).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {new Date(contract.amcEnd).toLocaleDateString()}
                      </div>
                      {isExpiringSoon(contract.amcEnd) && !isExpired(contract.amcEnd) && (
                        <div className="text-xs text-yellow-600 font-medium">
                          Expires in {Math.ceil((new Date(contract.amcEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {contract.location}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.vendor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {renderStatusBadge(contract)}
                        {renderTypeBadge(contract.amcType)}
                      </div>
                    </td>
                    {user?.role === 'MANAGER' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contract.owner.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contract.owner.email}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/contracts/${contract.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractList;